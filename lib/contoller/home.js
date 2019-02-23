
'use strict';

const Controller = require('egg').Controller;
const { stringify } = require('qs');

const getIp = function(req) {
  let ipAddress;
  const { headers, connection } = req;
  const forwardedIpsStr = headers['x-real-ip'] || headers['x-forwarded-for'];
  forwardedIpsStr ? ipAddress = forwardedIpsStr : ipAddress = null;
  if (!ipAddress && connection) {
    ipAddress = connection.remoteAddress;
  }
  if (ipAddress && ipAddress.indexOf(',') > 0) {
    ipAddress = ipAddress.split(',')[0];
  }
  return ipAddress;
};

class HomeController extends Controller {
  async index() {
    await this.ctx.render('index.html');
  }

  async proxy() {

    const { ctx, config, logger } = this;
    const { body, header, ips } = ctx.request;

    const { query } = ctx;
    let ip;
    if (ips && ips.length > 0) {
      ip = ips[0];
    } else {
      ip = getIp(ctx.request);
    }

    // use roadhog mock api first
    const url = `${config.apiPath}${ctx.path}?${stringify({
      ip,
      ...query,
    })}`;
    logger.info(`${ctx.method} ${url}`);

    const proxyObj = {
      method: ctx.method,
    };
    if (body) {
      proxyObj.data = { ...body };
    }
    if (header) {
      proxyObj.headers = { ...header };
    }

    const res = await this.ctx.curl(url, proxyObj);
    if (res.status !== 204) {
      ctx.body = res.data;
    }
    ctx.status = res.status;
    logger.info(`${ctx.method} ${url} ${res.status}`);
  }
}

module.exports = HomeController;
