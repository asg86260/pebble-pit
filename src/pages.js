// A station's board page and the element its rows go in, by the ids on its row
// in stations.js (`page`, `shop`; `<key>board` and `<key>shop` unless it
// says). A page the markup does not have is made from the row -- a title and a
// list, the shape every page has -- so a new station needs no markup of its
// own. Asked for, never gathered at load: the station table is read inside the
// import ring that loads this.

import { station } from './stations.js';

const pageId = key => station(key)?.page || `${key}board`;
const shopId = key => station(key)?.shop || `${key}shop`;

export function pageOf(key) {
  let el = document.getElementById(pageId(key));
  if (el && el.isConnected !== false) return el;
  const sheet = document.querySelector('.sheet') || document.getElementById('panel');
  if (!sheet) return el;
  el = document.createElement('div');
  el.id = pageId(key);
  el.className = 'page';
  el.hidden = true;
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = station(key)?.name || key;
  const rows = document.createElement('div');
  rows.id = shopId(key);
  rows.className = 'rows';
  el.append(title, rows);
  const last = [...sheet.querySelectorAll('.page')].pop();
  if (last) last.after(el); else sheet.append(el);
  return el;
}

export const shopOf = key => { pageOf(key); return document.getElementById(shopId(key)); };
