// PINy: VIEW = len na čítanie, EDIT = aj úpravy
const VIEW_PIN = '2233';
const EDIT_PIN = '8325';

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname !== '/api/data') return env.ASSETS.fetch(req);

    const pin = req.headers.get('x-pin') || '';
    const role = pin === EDIT_PIN ? 'edit' : pin === VIEW_PIN ? 'view' : null;
    if (!role) {
      await new Promise(r => setTimeout(r, 700)); // spomalenie hádania PINu
      return json({ error: 'pin' }, 401);
    }

    if (req.method === 'GET') {
      const d = await env.DATA.get('state');
      return json({ role, data: d ? JSON.parse(d) : null });
    }
    if (req.method === 'PUT') {
      if (role !== 'edit') return json({ error: 'read-only' }, 403);
      const body = await req.text();
      if (body.length > 500000) return json({ error: 'too big' }, 413);
      try { JSON.parse(body); } catch { return json({ error: 'bad json' }, 400); }
      await env.DATA.put('state', body);
      return json({ ok: true });
    }
    return json({ error: 'method' }, 405);
  }
};
