/**
 * @fileoverview Contact management for CLI
 * @module @prompt-or-die/cli/managers/ContactManager
 */

import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import { BaseManager } from './BaseManager.js';
import { Contact } from '../types.js';

/**
 * Contact manager class
 */
export class ContactManager extends BaseManager<Contact> {
  constructor(dataDir: string) {
    super(dataDir, 'contacts.json');
  }

  /**
   * Contact management menu
   */
  async showMenu(): Promise<void> {
    const action = await select({
      message: 'Contact Management Options:',
      choices: [
        { name: '👤 Add New Contact', value: 'create' },
        { name: '📋 List Contacts', value: 'list' },
        { name: '✏️  Edit Contact', value: 'edit' },
        { name: '🗑️  Delete Contact', value: 'delete' },
        { name: '🔍 Search Contacts', value: 'search' },
        { name: '📤 Export Contacts', value: 'export' },
        { name: '📥 Import Contacts', value: 'import' },
        { name: '🔙 Back to Main Menu', value: 'back' }
      ]
    });

    switch (action) {
      case 'create':
        await this.createContact();
        break;
      case 'list':
        await this.listContacts();
        break;
      case 'edit':
        await this.editContact();
        break;
      case 'delete':
        await this.deleteContact();
        break;
      case 'search':
        await this.searchContacts();
        break;
      case 'export':
        await this.exportContacts();
        break;
      case 'import':
        await this.importContacts();
        break;
      case 'back':
        return;
    }
  }

  /**
   * Create new contact
   */
  async createContact(): Promise<void> {
    console.log(chalk.blue('\n👤 Add New Contact\n'));

    const name = await input({
      message: 'Contact name:',
      validate: (value) => value.length > 0 || 'Name is required'
    });

    const email = await input({
      message: 'Email (optional):'
    });

    const phone = await input({
      message: 'Phone (optional):'
    });

    const organization = await input({
      message: 'Organization (optional):'
    });

    const role = await input({
      message: 'Role/Title (optional):'
    });

    const notes = await input({
      message: 'Notes (optional):'
    });

    const tagsInput = await input({
      message: 'Tags (comma-separated, optional):'
    });

    const contact = {
      id: `contact_${Date.now()}`,
      name,
      email: email || undefined,
      phone: phone || undefined,
      organization: organization || undefined,
      role: role || undefined,
      notes: notes || undefined,
      tags: tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.save(contact as Contact & { id: string });
    console.log(chalk.green(`\n✅ Contact '${name}' added successfully!`));
    await this.pressAnyKey();
  }

  /**
   * List all contacts
   */
  async listContacts(): Promise<void> {
    const contacts = this.loadAll();
    
    if (contacts.length === 0) {
      console.log(chalk.yellow('\n📭 No contacts found. Add one first!'));
      await this.pressAnyKey();
      return;
    }

    const table = new Table({
      head: ['Name', 'Email', 'Organization', 'Role', 'Tags'],
      colWidths: [20, 25, 20, 15, 15]
    });

    contacts.forEach(contact => {
      table.push([
        contact.name,
        contact.email || '-',
        contact.organization || '-',
        contact.role || '-',
        contact.tags.join(', ') || '-'
      ]);
    });

    console.log('\n📋 Contact List:\n');
    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Edit contact
   */
  async editContact(): Promise<void> {
    const contacts = this.loadAll();
    
    if (contacts.length === 0) {
      console.log(chalk.yellow('\n📭 No contacts found. Add one first!'));
      await this.pressAnyKey();
      return;
    }

    const choices = contacts.map(contact => ({
      name: `${contact.name} (${contact.email || 'No email'})`,
      value: contact.id
    }));

    const contactId = await select({
      message: 'Select contact to edit:',
      choices
    });

    const contact = this.findById(contactId);
    if (!contact) {
      console.log(chalk.red('\n❌ Contact not found!'));
      await this.pressAnyKey();
      return;
    }

    console.log(chalk.blue(`\n✏️  Editing: ${contact.name}\n`));

    const field = await select({
      message: 'What would you like to edit?',
      choices: [
        { name: 'Name', value: 'name' },
        { name: 'Email', value: 'email' },
        { name: 'Phone', value: 'phone' },
        { name: 'Organization', value: 'organization' },
        { name: 'Role', value: 'role' },
        { name: 'Notes', value: 'notes' },
        { name: 'Tags', value: 'tags' }
      ]
    });

    let newValue: string;
    if (field === 'tags') {
      newValue = await input({
        message: 'Tags (comma-separated):',
        default: contact.tags.join(', ')
      });
      (contact as any)[field] = newValue.split(',').map(t => t.trim()).filter(t => t);
    } else {
      newValue = await input({
        message: `New ${field}:`,
        default: (contact as any)[field] || ''
      });
      (contact as any)[field] = newValue || undefined;
    }

    contact.updatedAt = new Date();
    this.save(contact);
    console.log(chalk.green(`\n✅ Contact updated successfully!`));
    await this.pressAnyKey();
  }

  /**
   * Delete contact
   */
  async deleteContact(): Promise<void> {
    const contacts = this.loadAll();
    
    if (contacts.length === 0) {
      console.log(chalk.yellow('\n📭 No contacts found.'));
      await this.pressAnyKey();
      return;
    }

    const choices = contacts.map(contact => ({
      name: `${contact.name} (${contact.email || 'No email'})`,
      value: contact.id
    }));

    const contactId = await select({
      message: 'Select contact to delete:',
      choices
    });

    const contact = this.findById(contactId);
    if (!contact) {
      console.log(chalk.red('\n❌ Contact not found!'));
      await this.pressAnyKey();
      return;
    }

    const confirmed = await confirm({
      message: `Are you sure you want to delete '${contact.name}'?`
    });

    if (confirmed) {
      this.delete(contactId);
      console.log(chalk.green(`\n✅ Contact '${contact.name}' deleted successfully!`));
    } else {
      console.log(chalk.yellow('\n❌ Deletion cancelled.'));
    }
    
    await this.pressAnyKey();
  }

  /**
   * Search contacts
   */
  async searchContacts(): Promise<void> {
    const searchTerm = await input({
      message: 'Search contacts (name, email, organization):',
      validate: (value) => value.length > 0 || 'Search term is required'
    });

    const contacts = this.loadAll();
    const results = contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.organization && contact.organization.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (results.length === 0) {
      console.log(chalk.yellow(`\n🔍 No contacts found matching '${searchTerm}'`));
      await this.pressAnyKey();
      return;
    }

    const table = new Table({
      head: ['Name', 'Email', 'Organization', 'Role'],
      colWidths: [20, 25, 20, 15]
    });

    results.forEach(contact => {
      table.push([
        contact.name,
        contact.email || '-',
        contact.organization || '-',
        contact.role || '-'
      ]);
    });

    console.log(`\n🔍 Search Results (${results.length} found):\n`);
    console.log(table.toString());
    await this.pressAnyKey();
  }

  /**
   * Export contacts
   */
  async exportContacts(): Promise<void> {
    const contacts = this.loadAll();
    
    if (contacts.length === 0) {
      console.log(chalk.yellow('\n📭 No contacts to export.'));
      await this.pressAnyKey();
      return;
    }

    const filename = await input({
      message: 'Export filename:',
      default: `contacts-export-${new Date().toISOString().split('T')[0]}.json`
    });

    try {
      const { writeFileSync } = await import('fs');
      writeFileSync(filename, JSON.stringify(contacts, null, 2));
      console.log(chalk.green(`\n✅ Contacts exported to '${filename}'!`));
    } catch (error) {
      console.log(chalk.red(`\n❌ Export failed: ${(error as Error).message}`));
    }
    
    await this.pressAnyKey();
  }

  /**
   * Import contacts
   */
  async importContacts(): Promise<void> {
    const filename = await input({
      message: 'Import filename:',
      validate: (value) => {
        if (!value) return 'Filename is required';
        const { existsSync } = require('fs');
        if (!existsSync(value)) return 'File does not exist';
        return true;
      }
    });

    try {
      const { readFileSync } = await import('fs');
      const data = JSON.parse(readFileSync(filename, 'utf8'));
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid file format - expected array of contacts');
      }

      const existingContacts = this.loadAll();
      const newContacts = [...existingContacts, ...data];
      this.saveData(newContacts);
      
      console.log(chalk.green(`\n✅ Imported ${data.length} contacts from '${filename}'!`));
    } catch (error) {
      console.log(chalk.red(`\n❌ Import failed: ${(error as Error).message}`));
    }
    
    await this.pressAnyKey();
  }

  /**
   * Get contact count
   */
  override count(): number {
    return this.loadAll().length;
  }

  /**
   * Press any key to continue
   */
  private async pressAnyKey(): Promise<void> {
    await input({
      message: 'Press Enter to continue...'
    });
  }
}