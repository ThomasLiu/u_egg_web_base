'use strict';

const Controller = require('egg').Controller;
const { stringify } = require('qs');

class HomeController extends Controller {
  async index() {
    await this.ctx.render('index.html');
  }

  async proxy() {

    const { ctx, config, logger } = this;
    const { body, header, ip } = ctx.request;

    const query = {
      ip,
      ...ctx.query,
    };
    // use roadhog mock api first
    const url = `${config.apiPath}${ctx.path}?${stringify(query)}`;
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
