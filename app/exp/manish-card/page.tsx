import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Manish Card – Custom AR Experience',
  description: 'This link will host a specialized custom AR experience soon.'
}

export default function Page() {
  redirect('/api/ar/46e1ffac-0f7d-4127-be14-051a5eb27105')
}
