import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { useBackendData } from '../../hooks/useBackendData'
import type { Notification } from '../../types/notification'
import { updateBackend, removeBackend } from '../../services/backendDataService'
import { useAuth } from '../../hooks/useAuth'

export default function Notifications() {
  const { user } = useAuth()
  const source = useBackendData<Notification>('notifications').filter((item) => item.userId === user?.id)
  const [items, setItems] = useState(source)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const shown = items.filter((item) => filter === 'all' || !item.read)
  const markRead = async (item: Notification) => { const updated = await updateBackend('notifications', item.id, { ...item, read: true }); setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry)) }
  const remove = async (item: Notification) => { await removeBackend('notifications', item.id); setItems((current) => current.filter((entry) => entry.id !== item.id)) }
  return <><section className="az-user-page__intro az-user-page__intro--split"><div><p className="az-auth__eyebrow">Notifications</p><h2>Stay up to date</h2></div><Button variant="outline" onClick={() => { void Promise.all(items.filter((item) => !item.read).map(markRead)) }}>Mark all as read</Button></section><div className="az-tabs"><button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>All</button><button className={filter === 'unread' ? 'is-active' : ''} onClick={() => setFilter('unread')}>Unread</button></div>{!shown.length ? <EmptyState title="You're all caught up." /> : <section className="az-notifications">{shown.map((item) => <article className={`az-notification ${item.read ? '' : 'is-unread'}`} key={item.id}><div><h3>{item.title}</h3><p>{item.message}</p><small>{item.createdAt}</small></div><div><Button variant="link" onClick={() => { void markRead(item) }}>Mark read</Button><Button variant="ghost" iconOnly aria-label="Delete notification" onClick={() => { void remove(item) }}><Trash2 size={17} /></Button></div></article>)}</section>}</>
}
