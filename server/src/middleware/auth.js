import jwt from 'jsonwebtoken';

export function authGuard(req, res, next){
  const h = req.headers.authorization || '';
  const token = h.replace('Bearer ', '');
  if(!token) return res.status(401).json({ error: 'missing token' });
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload; // { uid }
    next();
  }catch(e){
    return res.status(401).json({ error: 'invalid token' });
  }
}
