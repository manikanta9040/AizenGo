import { Link } from 'react-router-dom'
import { Badge } from '../../components/common/Badge'
import { EmptyState } from '../../components/common/EmptyState'
import { useBackendData } from '../../hooks/useBackendData'
import type { Conference } from '../../types/conference'
import type { Registration } from '../../types/registration'
import { useAuth } from '../../hooks/useAuth'

export default function Registrations() {
  const { user } = useAuth()
  const conferences = useBackendData<Conference>('conferences')
  const items = useBackendData<Registration>('registrations').filter((item) => item.userId === user?.id)
  return <><section className="az-user-page__intro"><p className="az-auth__eyebrow">My Registrations</p><h2>Conference registrations</h2><p>Track your conference participation and payment status.</p></section>{!items.length ? <EmptyState title="No registrations yet" description="You haven't registered for any conferences yet." action={<Link className="az-button az-button--primary" to="/conferences">Browse Conferences</Link>} /> : <div className="az-user-table az-user-table--card"><div className="az-user-table__head"><span>ID</span><span>Conference</span><span>Type</span><span>Payment</span><span>Status</span></div>{items.map((item) => <Link className="az-user-table__row" to={`/dashboard/registrations/${item.id}`} key={item.id}><span>{item.id}</span><span>{conferences.find((conference) => conference.id === item.conferenceId)?.title}</span><span>{item.registrationType}</span><Badge variant={item.paymentStatus === 'PAID' ? 'success' : 'warning'}>{item.paymentStatus}</Badge><Badge variant={item.status === 'CONFIRMED' ? 'success' : 'info'}>{item.status}</Badge></Link>)}</div>}</>
}
