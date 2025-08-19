// Next.js 14+ API Route Segment Config for r2-base64 upload
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}
