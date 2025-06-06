import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/use-auth';
import { Database } from '../lib/database.types';
import type { Json } from '../lib/database.types';
import { Plus, Edit, Trash2, Search, User, Heart, Target, Users, Zap, AlertTriangle, Sparkles } from 'lucide-react';

type Character = Database['public']['Tables']['characters']['Row'];
type CharacterInsert = Database['public']['Tables']['characters']['Insert'];
type CharacterUpdate = Database['public']['Tables']['characters']['Update'];

interface CharacterFormData {
  name: string;
  description: string | null;
  personality: string[] | null;
  background: string | null;
  goals: string[] | null;
  relationships: Json | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  quirks: string[] | null;
  speaking_style: string | null;
  traits: Json | null;
}

const CharacterManager: React.FC = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    description: '',
    personality: [],
    background: '',
    goals: [],
    relationships: {},
    strengths: [],
    weaknesses: [],
    quirks: [],
    speaking_style: '',
    traits: {}
  });

  useEffect(() => {
    if (user) {
      fetchCharacters();
    }
  }, [user]);

  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters((data || []).map(char => ({
        ...char,
        goals: [],
        quirks: [],
        relationships: {},
        strengths: [],
        weaknesses: [],
        personality: []
      })));
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingCharacter) {
        const updateData: CharacterUpdate = {
          ...formData,
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase
          .from('characters')
          .update({
            ...updateData,
            personality: updateData.personality?.join(',') || null,
            goals: updateData.goals?.join(',') || null,
            strengths: updateData.strengths?.join(',') || null,
            weaknesses: updateData.weaknesses?.join(',') || null,
            quirks: updateData.quirks?.join(',') || null
          })
          .eq('id', editingCharacter.id);

        if (error) throw error;
      } else {
        const insertData: CharacterInsert = {
          ...formData,
          user_id: user.id
        };
        const { error } = await supabase
          .from('characters')
          .insert(insertData);

        if (error) throw error;
      }

      await fetchCharacters();
      resetForm();
    } catch (error) {
      console.error('Error saving character:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this character?')) return;

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCharacters();
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      description: character.description || '',
      personality: character.personality || [],
      background: character.background || '',
      goals: character.goals || [],
      relationships: character.relationships as Record<string, any> || {},
      strengths: character.strengths || [],
      weaknesses: character.weaknesses || [],
      quirks: character.quirks || [],
      speaking_style: character.speaking_style || '',
      traits: character.traits as Record<string, any> || {}
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      personality: [],
      background: '',
      goals: [],
      relationships: {},
      strengths: [],
      weaknesses: [],
      quirks: [],
      speaking_style: '',
      traits: {}
    });
    setEditingCharacter(null);
    setShowForm(false);
  };

  const handleArrayFieldChange = (field: keyof CharacterFormData, value: string) => {
    if (typeof formData[field] === 'object' && Array.isArray(formData[field])) {
      const items = value.split(',').map(item => item.trim()).filter(item => item);
      setFormData(prev => ({ ...prev, [field]: items }));
    }
  };

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.personality?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h2 className="text-2xl font-bold text-gray-900">Character Management</h2>
          <p className="text-gray-600">Create and manage character sheets for your prompts</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Character
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Character Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingCharacter ? 'Edit Character' : 'Create New Character'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Character Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter character name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Brief character description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background
                      </label>
                      <textarea
                        value={formData.background || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Character's background story"
                      />
                    </div>
                  </div>

                  {/* Traits */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Personality Traits
                      </label>
                      <input
                        type="text"
                        value={formData.personality?.join(', ') || ''}
                        onChange={(e) => handleArrayFieldChange('personality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="brave, curious, witty (comma-separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goals
                      </label>
                      <input
                        type="text"
                        value={formData.goals?.join(', ') || ''}
                        onChange={(e) => handleArrayFieldChange('goals', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="save the world, find love (comma-separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strengths
                      </label>
                      <input
                        type="text"
                        value={formData.strengths?.join(', ') || ''}
                        onChange={(e) => handleArrayFieldChange('strengths', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="leadership, magic, intelligence (comma-separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Weaknesses
                      </label>
                      <input
                        type="text"
                        value={formData.weaknesses?.join(', ') || ''}
                        onChange={(e) => handleArrayFieldChange('weaknesses', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="pride, fear of heights (comma-separated)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quirks
                      </label>
                      <input
                        type="text"
                        value={formData.quirks?.join(', ') || ''}
                        onChange={(e) => handleArrayFieldChange('quirks', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="always hums, collects coins (comma-separated)"
                      />
                    </div>
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
                    {editingCharacter ? 'Update Character' : 'Create Character'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Characters Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No characters found' : 'No characters yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first character to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Character
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharacters.map((character) => (
            <div key={character.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{character.name}</h3>
                  {character.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{character.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(character)}
                    className="text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(character.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {character.personality && character.personality.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Personality</p>
                      <p className="text-sm text-gray-600">{character.personality.slice(0, 3).join(', ')}</p>
                    </div>
                  </div>
                )}

                {character.goals && character.goals.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Goals</p>
                      <p className="text-sm text-gray-600">{character.goals.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                )}

                {character.strengths && character.strengths.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Strengths</p>
                      <p className="text-sm text-gray-600">{character.strengths.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                )}

                {character.weaknesses && character.weaknesses.length > 0 && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Weaknesses</p>
                      <p className="text-sm text-gray-600">{character.weaknesses.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                )}

                {character.quirks && character.quirks.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Quirks</p>
                      <p className="text-sm text-gray-600">{character.quirks.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Created {character.created_at ? new Date(character.created_at).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterManager;