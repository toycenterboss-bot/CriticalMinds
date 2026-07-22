// Fetch-клиент: access-токен в памяти (не в localStorage — и по правилам
// артефактов, и по безопасности), refresh — HttpOnly cookie, авторефреш при 401.
let accessToken = null

export function setToken(t) { accessToken = t }
export function clearToken() { accessToken = null }
export function hasToken() { return accessToken !== null }

async function rawFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  return fetch(`/api${path}`, { ...options, headers, credentials: 'include' })
}

export async function api(path, options = {}) {
  let res = await rawFetch(path, options)
  if (res.status === 401 && accessToken) {
    const r = await rawFetch('/auth/refresh', { method: 'POST' })
    if (r.ok) {
      accessToken = (await r.json()).access_token
      res = await rawFetch(path, options)
    } else {
      clearToken()
    }
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    let msg = data.detail
    if (Array.isArray(msg)) {
      // pydantic 422: [{msg: "Value error, ..."}]
      msg = msg.map((e) => (e.msg || '').replace(/^Value error,\s*/, '')).join('; ')
    }
    throw new Error(msg || `Ошибка ${res.status}`)
  }
  return res.status === 204 ? null : res.json()
}

export async function login(email, password) {
  const data = await api('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  setToken(data.access_token)
}

export async function acceptInvite(payload) {
  const data = await api('/auth/accept-invite', {
    method: 'POST', body: JSON.stringify(payload),
  })
  setToken(data.access_token)
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' }).catch(() => {})
  clearToken()
}
