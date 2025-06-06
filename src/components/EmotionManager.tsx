import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/use-auth';
import { Database } from '../lib/database.types';
import { Plus, Edit, Trash2, Search, Heart, TrendingUp, Activity, Zap, Brain, History } from 'lucide-react';

type Emotion = Database['public']['Tables']['emotions']['Row'];
type EmotionInsert = Database['public']['Tables']['emotions']['Insert'];
type EmotionUpdate = Database['public']['Tables']['emotions']['Update'];
type EmotionHistory = Database['public']['Tables']['emotion_history']['Row'];
type Character = Database['public']['Tables']['characters']['Row'];

interface EmotionFormData {
  name: string;
  description: string;
  intensity: number;
  triggers: string[];
  responses: string[];
  character_id?: string;
}

const EMOTION_CATEGORIES = [
  'Joy', 'Sadness', 'Anger', 'Fear', 'Surprise', 'Disgust',
  'Love', 'Excitement', 'Anxiety', 'Calm', 'Frustration', 'Hope',
  'Guilt', 'Pride', 'Shame', 'Envy', 'Gratitude', 'Contempt'
];

const EmotionManager: React.FC = () => {
  const { user } = useAuth();
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingEmotion, setEditingEmotion] = useState<Emotion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [formData, setFormData] = useState<EmotionFormData>({
    name: '',
    description: '',
    intensity: 5,
    triggers: [],
    responses: []
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [emotionsResult, charactersResult, historyResult] = await Promise.all([
        supabase
          .from('emotions')
          .select('*')
          .eq('user_id', user?.id || '')
          .order('created_at', { ascending: false }),
        supabase
          .from('characters')
          .select('*')
          .eq('user_id', user?.id || '')
          .order('name'),
        supabase
          .from('emotion_history')
          .select('*, emotions(name), characters(name)')
          .eq('user_id', user?.id || '')
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (emotionsResult.error) throw emotionsResult.error;
      if (charactersResult.error) throw charactersResult.error;
      if (historyResult.error) throw historyResult.error;

      setEmotions((emotionsResult.data || []).map(emotion => ({
        ...emotion,
        arousal: null,
        context: null,
        dominance: null,
        primary_emotion: null,
        secondary_emotions: null,
        valence: null
      })));
      setCharacters((charactersResult.data || []).map(character => ({
        ...character,
        goals: [],
        quirks: [],
        relationships: [],
        strengths: [],
        weaknesses: [],
        personality: character.personality ? [character.personality] : []
      })));
      setEmotionHistory(historyResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingEmotion) {
        const { error } = await supabase
          .from('emotions')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          } as EmotionUpdate)
          .eq('id', editingEmotion.id);

        if (error) throw error;
      } else {
        const { data: newEmotion, error } = await supabase
          .from('emotions')
          .insert({
            ...formData,
            user_id: user.id
          } as EmotionInsert)
          .select()
          .single();

        if (error) throw error;

        // Add to emotion history
        if (newEmotion && formData.character_id) {
          await supabase
            .from('emotion_history')
            .insert({
              emotion_id: newEmotion.id,
              character_id: formData.character_id,
              intensity: formData.intensity,
              context: formData.description || null
            });
        }
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving emotion:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emotion?')) return;

    try {
      const { error } = await supabase
        .from('emotions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting emotion:', error);
    }
  };

  const handleEdit = (emotion: Emotion) => {
    setEditingEmotion(emotion);
    setFormData({
      name: emotion.name,
      description: emotion.description || '',
      intensity: emotion.intensity || 5,
      triggers: emotion.triggers || [],
      responses: emotion.responses || []
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      intensity: 5,
      triggers: [],
      responses: []
    });
    setEditingEmotion(null);
    setShowForm(false);
  };

  const handleArrayFieldChange = (field: keyof EmotionFormData, value: string) => {
    if (typeof formData[field] === 'object' && Array.isArray(formData[field])) {
      const items = value.split(',').map(item => item.trim()).filter(item => item);
      setFormData(prev => ({ ...prev, [field]: items }));
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      'Joy': 'text-yellow-600 bg-yellow-100',
      'Sadness': 'text-blue-600 bg-blue-100',
      'Anger': 'text-red-600 bg-red-100',
      'Fear': 'text-purple-600 bg-purple-100',
      'Surprise': 'text-orange-600 bg-orange-100',
      'Disgust': 'text-green-600 bg-green-100',
      'Love': 'text-pink-600 bg-pink-100',
      'Excitement': 'text-yellow-600 bg-yellow-100',
      'Anxiety': 'text-purple-600 bg-purple-100',
      'Calm': 'text-blue-600 bg-blue-100'
    };
    return colors[emotion] || 'text-gray-600 bg-gray-100';
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return 'text-green-600 bg-green-100';
    if (intensity <= 6) return 'text-yellow-600 bg-yellow-100';
    if (intensity <= 8) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredEmotions = emotions.filter(emotion => {
    const matchesSearch = emotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emotion.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emotion Management</h2>
          <p className="text-gray-600">Create and manage emotional states for characters</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Emotion
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search emotions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">All Characters</option>
          {characters.map(character => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </select>
      </div>

      {/* Emotion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingEmotion ? 'Edit Emotion' : 'Create New Emotion'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emotion Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter emotion name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Emotion *
                      </label>
                      <select
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, primary_emotion: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select primary emotion</option>
                        {EMOTION_CATEGORIES.map(emotion => (
                          <option key={emotion} value={emotion}>{emotion}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Character (Optional)
                      </label>
                      <select
                        value={formData.character_id || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, character_id: e.target.value || '' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">No character</option>
                        {characters.map(character => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Context
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Situation or context for this emotion"
                      />
                    </div>
                  </div>

                  {/* Emotional Dimensions */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Intensity (1-10): {formData.intensity}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.intensity}
                        onChange={(e) => setFormData(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Mild</span>
                        <span>Moderate</span>
                        <span>Intense</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valence (-1 to 1): {(formData as any).valence?.toFixed(2) || '0.00'}
                      </label>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={(formData as any).valence || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, valence: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Negative</span>
                        <span>Neutral</span>
                        <span>Positive</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arousal (0 to 1): {(formData as any).arousal?.toFixed(2) || '0.00'}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={(formData as any).arousal || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, arousal: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Calm</span>
                        <span>Excited</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dominance (0 to 1): {((formData as any).dominance || 0).toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={(formData as any).dominance || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, dominance: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Submissive</span>
                        <span>Dominant</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Emotions
                    </label>
                    <input
                      type="text"
                      value={(formData as any).secondary_emotions?.join(', ') || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_emotions: e.target.value.split(',').map(item => item.trim()).filter(item => item) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="anxiety, hope (comma-separated)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Triggers
                    </label>
                    <input
                      type="text"
                      value={formData.triggers.join(', ')}
                      onChange={(e) => handleArrayFieldChange('triggers', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="loud noises, criticism (comma-separated)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responses
                    </label>
                    <input
                      type="text"
                      value={formData.responses.join(', ')}
                      onChange={(e) => handleArrayFieldChange('responses', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="fight, flight, freeze (comma-separated)"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingEmotion ? 'Update Emotion' : 'Create Emotion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Emotion History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Emotion History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                {emotionHistory.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{(entry as any).emotions?.name}</span>
                        {(entry as any).characters?.name && (
                          <span className="text-sm text-gray-500">• {(entry as any).characters.name}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.triggered_at || new Date()).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getIntensityColor(entry.intensity || 0)}`}>
                        Intensity: {entry.intensity}
                      </span>
                      {entry.context && (
                        <span className="text-gray-600">{entry.context}</span>
                      )}
                    </div>
                    {entry.context && (
                      <p className="text-sm text-gray-600 mt-2">{entry.context}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emotions Grid */}
      {filteredEmotions.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCharacter ? 'No emotions found' : 'No emotions yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCharacter ? 'Try adjusting your filters' : 'Create your first emotion to get started'}
          </p>
          {!searchTerm && !selectedCharacter && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Emotion
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmotions.map((emotion) => {
            const character = characters.find(c => c.id === (emotion as any).character_id);
            return (
              <div key={emotion.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{emotion.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getEmotionColor(emotion.name)}`}>
                        {emotion.name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getIntensityColor(emotion.intensity || 0)}`}>
                        {emotion.intensity}/10
                      </span>
                    </div>
                    {character && (
                      <p className="text-sm text-gray-600 mt-1">Character: {character.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(emotion)}
                      className="text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emotion.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Valence</p>
                      <p className={`font-medium ${(emotion as any).valence >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(emotion as any).valence?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Arousal</p>
                      <p className="font-medium text-blue-600">{(emotion as any).arousal?.toFixed(1) || '0.0'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Dominance</p>
                      <p className="font-medium text-purple-600">{(emotion as any).dominance?.toFixed(1) || '0.0'}</p>
                    </div>
                  </div>

                  {emotion.description && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Context</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{emotion.description}</p>
                    </div>
                  )}

                  {(emotion as any).secondary_emotions && (emotion as any).secondary_emotions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Secondary</p>
                      <p className="text-sm text-gray-600">{(emotion as any).secondary_emotions?.slice(0, 3).join(', ')}</p>
                    </div>
                  )}

                  {emotion.triggers && emotion.triggers.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Triggers</p>
                      <p className="text-sm text-gray-600">{emotion.triggers.slice(0, 2).join(', ')}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created {emotion.created_at ? new Date(emotion.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmotionManager;