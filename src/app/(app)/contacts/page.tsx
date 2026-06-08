'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { formatDate, CURRENCIES } from '@/lib/utils';
import type { Contact } from '@/lib/types';
import {
  Users, UserCheck, Truck, Plus, Search, X,
  Mail, Phone, MapPin, Building2, Edit2, Trash2, Eye, FileText
} from 'lucide-react';
import clsx from 'clsx';

type ContactType = 'customer' | 'vendor' | 'both';
type FilterTab = 'all' | 'customer' | 'vendor';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  type: 'customer' as ContactType,
  company: '',
  address: '',
  city: '',
  country: '',
  taxId: '',
  currency: 'USD',
  notes: '',
  isActive: true,
};

function typeBadge(type: ContactType) {
  const styles: Record<ContactType, string> = {
    customer: 'bg-blue-100 text-blue-700',
    vendor: 'bg-amber-100 text-amber-700',
    both: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={clsx('text-xs font-medium capitalize px-2 py-0.5 rounded-full', styles[type])}>
      {type}
    </span>
  );
}

export default function ContactsPage() {
  const { myContacts, addContact, updateContact, deleteContact, auth } = useApp();
  const contacts = myContacts();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const filtered = useMemo(() => {
    let list = contacts;
    if (filterTab === 'customer') list = list.filter(c => c.type === 'customer' || c.type === 'both');
    if (filterTab === 'vendor') list = list.filter(c => c.type === 'vendor' || c.type === 'both');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [contacts, filterTab, search]);

  const customerCount = contacts.filter(c => c.type === 'customer' || c.type === 'both').length;
  const vendorCount = contacts.filter(c => c.type === 'vendor' || c.type === 'both').length;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `All (${contacts.length})` },
    { key: 'customer', label: `Customers (${customerCount})` },
    { key: 'vendor', label: `Vendors (${vendorCount})` },
  ];

  function resetAndOpenAdd() {
    setForm(EMPTY_FORM);
    setShowAddModal(true);
  }

  function handleAdd() {
    if (!form.name.trim()) return;
    addContact(form);
    setShowAddModal(false);
  }

  function openView(c: Contact) {
    setViewContact(c);
    setIsEditing(false);
    setEditForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      type: c.type,
      company: c.company,
      address: c.address,
      city: c.city,
      country: c.country,
      taxId: c.taxId,
      currency: c.currency,
      notes: c.notes,
      isActive: c.isActive,
    });
  }

  function handleSaveEdit() {
    if (!viewContact || !editForm.name.trim()) return;
    updateContact(viewContact.id, editForm);
    setViewContact({ ...viewContact, ...editForm });
    setIsEditing(false);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteContact(deleteTarget.id);
    setDeleteTarget(null);
    if (viewContact?.id === deleteTarget.id) setViewContact(null);
  }

  function avatar(name: string) {
    const initial = name.charAt(0).toUpperCase();
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500',
      'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
    ];
    const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % colors.length;
    return (
      <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm', colors[idx])}>
        {initial}
      </div>
    );
  }

  const formFields = (
    values: typeof EMPTY_FORM,
    onChange: (updates: Partial<typeof EMPTY_FORM>) => void,
  ) => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(['customer', 'vendor', 'both'] as ContactType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => onChange({ type: t })}
            className={clsx(
              'py-2 px-3 text-sm font-medium rounded-lg border capitalize transition-colors',
              values.type === t
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
          <input
            value={values.name}
            onChange={e => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contact name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Company</label>
          <input
            value={values.company}
            onChange={e => onChange({ company: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Company name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={values.email}
            onChange={e => onChange({ email: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
          <input
            value={values.phone}
            onChange={e => onChange({ phone: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
          <input
            value={values.address}
            onChange={e => onChange({ address: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Street address"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
          <input
            value={values.city}
            onChange={e => onChange({ city: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="City"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Country</label>
          <input
            value={values.country}
            onChange={e => onChange({ country: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Country"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Currency</label>
          <select
            value={values.currency}
            onChange={e => onChange({ currency: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID</label>
          <input
            value={values.taxId}
            onChange={e => onChange({ taxId: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tax identification number"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea
            value={values.notes}
            onChange={e => onChange({ notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Internal notes about this contact..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500">Manage your customers and vendors</p>
        </div>
        <button
          onClick={resetAndOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Contacts', value: contacts.length, icon: Users, iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
          { label: 'Customers', value: customerCount, icon: UserCheck, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
          { label: 'Vendors', value: vendorCount, icon: Truck, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
              </div>
              <div className={clsx('p-2.5 rounded-xl', card.iconBg)}>
                <card.icon className={clsx('w-5 h-5', card.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts by name, email, company, or city..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  filterTab === tab.key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact list */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">
              {contacts.length === 0 ? 'No contacts yet' : 'No contacts match your search'}
            </p>
            {contacts.length === 0 && (
              <button
                onClick={resetAndOpenAdd}
                className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(c => (
              <div
                key={c.id}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => openView(c)}
              >
                {avatar(c.name)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                    {typeBadge(c.type)}
                    {!c.isActive && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.email && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" /> {c.email}
                      </span>
                    )}
                    {(c.city || c.country) && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {[c.city, c.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); openView(c); }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTarget(c); }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Add Contact Modal ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-semibold text-slate-900">Add Contact</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              {formFields(form, updates => setForm(prev => ({ ...prev, ...updates })))}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.name.trim()}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  form.name.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== View / Edit Contact Modal ===== */}
      {viewContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setViewContact(null); setIsEditing(false); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? 'Edit Contact' : 'Contact Details'}
              </h2>
              <div className="flex items-center gap-1">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                )}
                <button
                  onClick={() => { setViewContact(null); setIsEditing(false); }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <>
                <div className="p-6">
                  {formFields(editForm, updates => setEditForm(prev => ({ ...prev, ...updates })))}
                </div>
                <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editForm.name.trim()}
                    className={clsx(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      editForm.name.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 space-y-5">
                {/* Profile header */}
                <div className="flex items-center gap-4">
                  {avatar(viewContact.name)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{viewContact.name}</h3>
                      {typeBadge(viewContact.type)}
                    </div>
                    {viewContact.company && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" /> {viewContact.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4">
                  {viewContact.email && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {viewContact.email}
                      </p>
                    </div>
                  )}
                  {viewContact.phone && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {viewContact.phone}
                      </p>
                    </div>
                  )}
                  {viewContact.address && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Address</p>
                      <p className="text-sm text-slate-700 mt-0.5">{viewContact.address}</p>
                    </div>
                  )}
                  {(viewContact.city || viewContact.country) && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Location</p>
                      <p className="text-sm text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {[viewContact.city, viewContact.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {viewContact.currency && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Currency</p>
                      <p className="text-sm text-slate-700 mt-0.5">
                        {CURRENCIES.find(cur => cur.code === viewContact.currency)?.symbol || ''} {viewContact.currency}
                      </p>
                    </div>
                  )}
                  {viewContact.taxId && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tax ID</p>
                      <p className="text-sm text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> {viewContact.taxId}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</p>
                    <p className="text-sm mt-0.5">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        viewContact.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      )}>
                        {viewContact.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Created</p>
                    <p className="text-sm text-slate-700 mt-0.5">{formatDate(viewContact.createdAt)}</p>
                  </div>
                </div>

                {viewContact.notes && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{viewContact.notes}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(viewContact)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Dialog ===== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Contact</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteTarget.name}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
