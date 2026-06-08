'use client';

import { useState } from 'react';
import {
  Users, Building, Mail, Phone, MapPin, Globe, Edit2
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '@/components/PageHeader';
import { contacts, formatCurrency, formatDate } from '@/lib/data';
import type { Contact } from '@/lib/types';

export default function ContactsPage() {
  const [filter, setFilter] = useState<'all' | 'customer' | 'vendor'>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.type === filter);
  const customers = contacts.filter(c => c.type === 'customer');
  const vendors = contacts.filter(c => c.type === 'vendor');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Contacts"
        description="Manage customers and vendors"
        icon={Users}
        actionLabel="Add Contact"
        onAction={() => setShowCreate(true)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Contacts</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Customers</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{customers.length}</p>
          <p className="text-xs text-slate-400">Receivable: {formatCurrency(customers.reduce((s, c) => s + c.balance, 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Vendors</p>
          <p className="text-xl font-bold text-violet-600 mt-1">{vendors.length}</p>
          <p className="text-xs text-slate-400">Payable: {formatCurrency(Math.abs(vendors.reduce((s, c) => s + c.balance, 0)))}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(['all', 'customer', 'vendor'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors capitalize ${
                  filter === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'All' : type === 'customer' ? 'Customers' : 'Vendors'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((contact) => (
            <div
              key={contact.id}
              className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => setSelectedContact(contact)}
            >
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                contact.type === 'customer' ? 'bg-blue-100' : 'bg-violet-100'
              )}>
                <span className={clsx(
                  'text-sm font-bold',
                  contact.type === 'customer' ? 'text-blue-600' : 'text-violet-600'
                )}>
                  {contact.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{contact.name}</p>
                  <span className={clsx(
                    'text-[10px] font-medium px-1.5 py-0.5 rounded capitalize',
                    contact.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'
                  )}>
                    {contact.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {contact.email}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {contact.city}, {contact.country}
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={clsx(
                  'text-sm font-semibold',
                  contact.balance >= 0 ? 'text-slate-900' : 'text-red-600'
                )}>
                  {formatCurrency(Math.abs(contact.balance), contact.currency)}
                </p>
                <p className="text-xs text-slate-400">
                  {contact.balance >= 0 ? 'Receivable' : 'Payable'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedContact(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  selectedContact.type === 'customer' ? 'bg-blue-100' : 'bg-violet-100'
                )}>
                  <span className={clsx(
                    'text-lg font-bold',
                    selectedContact.type === 'customer' ? 'text-blue-600' : 'text-violet-600'
                  )}>
                    {selectedContact.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedContact.name}</h2>
                  <p className="text-sm text-slate-500 capitalize">{selectedContact.type} · {selectedContact.company}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{selectedContact.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">{selectedContact.phone}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-700">
                  {selectedContact.address}, {selectedContact.city}, {selectedContact.state} {selectedContact.zipCode}, {selectedContact.country}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Tax ID</p>
                  <p className="text-sm font-medium text-slate-900">{selectedContact.taxId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Currency</p>
                  <p className="text-sm font-medium text-slate-900">{selectedContact.currency}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Balance</p>
                  <p className={clsx('text-sm font-bold', selectedContact.balance >= 0 ? 'text-slate-900' : 'text-red-600')}>
                    {formatCurrency(Math.abs(selectedContact.balance), selectedContact.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Since</p>
                  <p className="text-sm font-medium text-slate-900">{formatDate(selectedContact.createdAt)}</p>
                </div>
              </div>
              {selectedContact.notes && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{selectedContact.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setSelectedContact(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
              <button className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Contact</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Type</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                    <option>CAD - Canadian Dollar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name / Company</label>
                <input type="text" placeholder="Full name or company name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" placeholder="email@example.com" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" placeholder="+1 (555) 000-0000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input type="text" placeholder="Street address" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                  <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                <input type="text" placeholder="Tax identification number" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Add Contact</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
