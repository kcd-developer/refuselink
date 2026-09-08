import assert from 'node:assert/strict'
import { test } from 'node:test'
import { visibleCommunityContact } from './community-contact-privacy'

const boardContact = {
  role: 'board_member', publicEmail: 'board@example.com', publicPhone: '555-0100',
  showEmail: true, showPhone: true,
  shareEmailWithCommunity: false, sharePhoneWithCommunity: false,
}

test('staff visibility flags do not expose board contacts without member consent', () => {
  assert.deepEqual(visibleCommunityContact(boardContact, false), { publicEmail: null, publicPhone: null })
})

test('email and phone consent are independent and revocable', () => {
  assert.deepEqual(visibleCommunityContact({ ...boardContact, shareEmailWithCommunity: true }, false), { publicEmail: 'board@example.com', publicPhone: null })
  assert.deepEqual(visibleCommunityContact({ ...boardContact, sharePhoneWithCommunity: true }, false), { publicEmail: null, publicPhone: '555-0100' })
  assert.deepEqual(visibleCommunityContact({ ...boardContact, shareEmailWithCommunity: true, sharePhoneWithCommunity: true }, false), { publicEmail: 'board@example.com', publicPhone: '555-0100' })
  assert.deepEqual(visibleCommunityContact(boardContact, false), { publicEmail: null, publicPhone: null })
})

test('fellow board members in the same community retain contact access', () => {
  assert.deepEqual(visibleCommunityContact(boardContact, true), { publicEmail: 'board@example.com', publicPhone: '555-0100' })
})

test('manager directory visibility retains its existing settings', () => {
  assert.deepEqual(visibleCommunityContact({ ...boardContact, role: 'community_manager', showPhone: false }, false), { publicEmail: 'board@example.com', publicPhone: null })
})
