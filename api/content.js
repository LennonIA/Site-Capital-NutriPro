/**
 * Vercel: páginas geradas no servidor para SEO.
 *   /insights/:slug -> artigo (?type=article&slug=)
 *   /sitemap.xml    -> ?type=sitemap
 *   /robots.txt     -> ?type=robots
 */
'use strict';

const fs = require('fs');
const path = require('path');
const core = require('../lib/core');

const DIR = path.join(process.cwd(), 'public', 'insights');

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  return `https://${req.headers['x-forwarded-host'] || req.headers.host}`;
}

module.exports = (req, res) => {
  const url = siteUrl(req);
  const type = req.query.type;
  if (type === 'robots') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send(core.robotsTxt(url));
  }
  const articles = JSON.parse(fs.readFileSync(path.join(DIR, 'articles.json'), 'utf8'));
  if (type === 'sitemap') {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(core.sitemapXML(articles, url));
  }
  const tpl = fs.readFileSync(path.join(DIR, 'artigo.html'), 'utf8');
  const html = core.renderArticle(tpl, articles, String(req.query.slug || ''), url);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!html) return res.status(404).send(fs.readFileSync(path.join(process.cwd(), 'public', '404.html'), 'utf8'));
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(html);
};
