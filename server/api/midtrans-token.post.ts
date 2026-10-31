export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const serverKey = (body?.server_key as string) || (config.midtransServerKey as string) || 'SB-Mid-server-FVYRHW4KMT1AgoyI.cfgKDnt'

  // 1. Coba teruskan request ke Laravel backend terlebih dahulu
  const candidateUrls = Array.from(new Set([
    'http://localhost:8000/api/midtrans-token',
    'http://127.0.0.1:8000/api/midtrans-token',
    (config.public.midtransApiUrl as string) || 'http://172.16.7.19:8000/api/midtrans-token',
    'http://172.16.7.19:8000/api/midtrans-token'
  ])).filter(Boolean)

  for (const targetUrl of candidateUrls) {
    try {
      const response: any = await $fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Server-Key': serverKey
        },
        body: {
          ...body,
          server_key: serverKey
        },
        timeout: 4000
      })

      const token = response?.snap_token || response?.token || response?.data?.snap_token || response?.data?.token
      if (token) {
        console.log(`[Midtrans Proxy] Berhasil memperoleh token dari Laravel backend (${targetUrl})`)
        return response
      }
    } catch (err: any) {
      console.warn(`[Midtrans Proxy] Backend ${targetUrl} gagal:`, err?.data || err?.message)
    }
  }

  // 2. Direct Midtrans Snap API menggunakan Sandbox Server Key
  console.log('[Midtrans Proxy] Menghubungi Midtrans Sandbox Snap API dengan Server Key:', serverKey)
  const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64')
  const orderId = `ORDER-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
  const grossAmount = Number(body.gross_amount) || 10000

  const midtransPayload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount
    },
    customer_details: {
      first_name: body.first_name || 'Pelanggan',
      email: body.email || 'pelanggan@example.com'
    },
    item_details: [
      {
        id: 'ITEM-1',
        price: grossAmount,
        quantity: 1,
        name: (body.item_name || 'Alat Medis Anisa Medika').substring(0, 50)
      }
    ]
  }

  // Coba Sandbox terlebih dahulu
  try {
    const sandboxRes: any = await $fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: midtransPayload
    })

    if (sandboxRes?.token) {
      console.log('[Midtrans Proxy] Sukses generate token via Midtrans Sandbox Snap API:', sandboxRes.token)
      return {
        status: 'success',
        token: sandboxRes.token,
        snap_token: sandboxRes.token,
        redirect_url: sandboxRes.redirect_url,
        is_production: false
      }
    }
  } catch (sandboxErr: any) {
    console.warn('[Midtrans Proxy] Sandbox API gagal, mencoba Production:', sandboxErr?.data || sandboxErr?.message)
  }

  // Fallback ke Production jika Sandbox gagal
  try {
    const prodRes: any = await $fetch('https://app.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: midtransPayload
    })

    if (prodRes?.token) {
      console.log('[Midtrans Proxy] Sukses generate token via Midtrans Production Snap API:', prodRes.token)
      return {
        status: 'success',
        token: prodRes.token,
        snap_token: prodRes.token,
        redirect_url: prodRes.redirect_url,
        is_production: true
      }
    }
  } catch (prodErr: any) {
    const errData = prodErr?.data || prodErr?.response?._data
    console.error('[Midtrans Proxy Fatal Error]:', errData || prodErr?.message)
    throw createError({
      statusCode: prodErr?.statusCode || 500,
      statusMessage: errData?.message || errData?.error || 'Gagal generate Snap Token dari Midtrans API',
      data: errData
    })
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Gagal memperoleh Snap Token dari Midtrans'
  })
})


