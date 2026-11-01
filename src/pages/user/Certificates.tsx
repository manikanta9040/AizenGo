import { Award } from 'lucide-react'
import { Card, CardContent } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { useBackendData } from '../../hooks/useBackendData'
import type { Certificate } from '../../types/certificate'
import type { Conference } from '../../types/conference'
import { useAuth } from '../../hooks/useAuth'

export default function Certificates() {
  const { user } = useAuth()
  const conferences = useBackendData<Conference>('conferences')
  const items = useBackendData<Certificate>('certificates').filter((item) => item.userId === user?.id)
  return <><section className="az-user-page__intro"><p className="az-auth__eyebrow">My Certificates</p><h2>Certificates</h2><p>Your earned AizenGo credentials.</p></section>{!items.length ? <EmptyState title="No certificates available yet" /> : <section className="az-certificate-grid">{items.map((item) => <Card key={item.id} className="az-certificate"><CardContent><Award size={35} /><p>AizenGo</p><h3>{item.certificateType}</h3><strong>{item.participantName}</strong><span>{conferences.find((conference) => conference.id === item.conferenceId)?.title}</span><small>Issued {item.issuedAt} · {item.certificateId}</small><Button variant="outline" onClick={() => alert('Certificate preview is a frontend placeholder.')}>View Certificate</Button></CardContent></Card>)}</section>}</>
}
