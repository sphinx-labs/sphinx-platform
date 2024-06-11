export { default } from '@/server/api/propose'
export const config = {
  maxDuration: 300,
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}
