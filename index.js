'use strict'

const internals = {
}

const showdown = require('showdown')
const converter = new showdown.Converter()

const setSiteUrl = (url) => {
  internals.siteUrl = url
}

const decoders = [
  {
    token: 'link:item:',
    catch: function (line) { return line.includes(this.token) },
    resolve: function (id) { return `${internals.siteUrl}/items/${id} ` },
    decode: function (line) {
      console.log('this.token = ', this.token)
      line = line.split(this.token)
      console.log('line = ', line)
      if (line[1] && line[1].length) {
        console.log('line[1] = ', line[1])
        line[1] = line[1].split(' ')
        let id = parseInt(line[1].shift())
        if (Number.isSafeInteger(id)) {
          line[1] = line[1].join('')
          return line.join(this.resolve(id))
        } else {
          return false
        }
      } else {
        return false
      }
    }
  }
]

const makeTextBlock = (section, {markdown} = {}) => {
  let text = section.get('block')
  let title = section.get('title')
  if (title && title.length) {
    title = `<h2>${title}</h2>`
  }

  if (markdown) {
    text = converter.makeHtml(text)
  }

  let lines = text.split('\n')
  lines = lines.map(line => {
    return line.split(' ').map(el => {
      if (el && el.length) {
        let decoder = decoders.find(function (d) {
          return d.catch(el)
        })
        if (decoder) {
          el = decoder.decode(el)
        }
      }
      return el
    }).join(' ')
  }).join(markdown ? '' : '<br />')
  // try {
  //   lines = converter.makeHtml(lines)
  // } catch (ex) {
  //   console.error(ex)
  // }
  return `${title || ''}<div class='pub-abzac'>${lines}</div>`
}

const processPubSection = async (pubSection, img, clickImg, opts) => {
  if (pubSection.get('blocktype') === 'text') {
    return makeTextBlock(pubSection, opts)
  }
  if (pubSection.get('blocktype') === 'photo') {
    if (img) {
      const imgDiv = (rec, id) => {
        let d = [`<div class='pub-photo'><div class='pub-photo-visible' style='max-width:${img.width + 2}px'>`]
        let maxDataIdAttr = clickImg ? `data-imagemax-id='${clickImg.id}' data-dim='${clickImg.width}:${clickImg.height}' ` : ''
        d.push(`<img style='max-width:${img.width}px;max-height:${img.height}px' src='/pubimages/${id}' ${maxDataIdAttr}alt='${rec.get('title')}'>`)
        if (rec.get('title')) {
          d.push(`<span>${rec.get('title')}</span>`)
        }
        if (clickImg) {
          d.push(`<div id='modal-img${clickImg.id}' class='modal-img'><span class="close" id='close${clickImg.id}'>&times;</span><img class="modal-content" id="img${clickImg.id}"><div class="caption">${pubSection.get('title')}</div></div>`)
        }
        d.push('</div></div>')
        return d.join('')
      }
      return imgDiv(pubSection, img.id)
    }
  }
}

module.exports = ({url} = {}) => {
  if (!url || typeof url !== 'string') {
    throw new Error('pub_maker url must be set and be a string')
  }
  setSiteUrl(url)
  return {
    setSiteUrl,
    makeTextBlock,
    processPubSection
  }
}
