export async function GET() {
  return Response.json({
    ip: process.env.LOCAL_IP || 'localhost',
    port: process.env.PORT || '3000',
  })
}
