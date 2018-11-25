const BusinessError = require('../util/index').BusinessError;
var express = require('express');
var router = express.Router();
var customerRouter = require('./customer/index');
var platformRouter = require('./platform/index');
var usersRouter = require('./users');
var tokenService=require('../services/token');
const OPEN_URLS = ['/api/users/login', '/api/users/get_vali_code', '/api/users/regedit_customer'];
/**
 * 过滤器
 */
router.use((req, res, next)=>{
  if (OPEN_URLS.indexOf(req.originalUrl) != -1) {
      return next();
  }
  let token = req.headers.token;
  if (!token) {
      return next(new BusinessError(20401, "会话过期，请重新登录！"));
  } else {
      tokenService.checkToken(token, function (err, tokenObject) {
          if (err) {
              console.error(err);
              return next(new BusinessError(20500, "服务器异常，请稍后重试"));
          }
          if (!tokenObject) {
              return next(new BusinessError(20401, "会话过期，请重新登录！"));
          } else {
              req.token = tokenObject;
              next();
              //延时token
              tokenService.delay(token);
          }
      });
  }
});

/**
 * 装载路由
 * 1.用户
 */
router.use('/users', usersRouter);
router.use('/customer', customerRouter);
router.use('/platform', platformRouter);

/**
 * 404
 */
router.use((req, res, next) => {
  res.status(404).send(JSON.stringify({ code: 20404, message: '找不到请求的资源' }));
});

/**
 * 错误处理
 */
router.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof BusinessError) {
    return res.send(JSON.stringify({ code: err.code, message: err.message }));
  }
  res.status(500).send(JSON.stringify({ code: 20500, message: '服务器异常，请稍后重试!' }));
});

module.exports = router;
