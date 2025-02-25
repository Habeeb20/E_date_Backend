import jwt from "jsonwebtoken"

export const verifyToken = (req, res, next) => {
    let token = req.header('authorization');
  
    token = token.split(' ')[1]
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
      req.user = decoded;
      next();
    } catch (e) {
      console.log(e)
      res.status(400).json({ msg: 'Token is not valid' });
    }
  };
  