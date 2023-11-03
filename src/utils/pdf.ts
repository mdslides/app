import jsPDF from 'jspdf'
import { elementToSVG } from 'dom-to-svg'

import 'svg2pdf.js'

import mulishFont from '../fonts/mulish.json'

const format = [1200, 900]

const addFonts = (doc: jsPDF) => {
  doc.addFileToVFS('MulishBold.ttf', mulishFont.bold)
  doc.addFileToVFS('MulishBoldItalic.ttf', mulishFont.boldItalic)
  doc.addFileToVFS('MulishRegular.ttf', mulishFont.regular)
  doc.addFileToVFS('MulishRegularItalic.ttf', mulishFont.regularItalic)

  doc.addFont('MulishBold.ttf', 'Mulish', 'normal', 700)
  doc.addFont('MulishBoldItalic.ttf', 'Mulish', 'italic', 700)
  doc.addFont('MulishRegular.ttf', 'Mulish', 'normal', 400)
  doc.addFont('MulishRegularItalic.ttf', 'Mulish', 'italic', 400)
}

export const createPdf = async (pages: HTMLCollection) => {
  const doc = new jsPDF({
    filters: ['ASCIIHexEncode'],
    orientation: 'landscape',
    unit: 'px',
    format,
  })

  addFonts(doc)
  doc.deletePage(1)

  for (const child of Array.from(pages)) {
    doc.addPage()
    const page = elementToSVG(child)
    await doc.svg(page.documentElement, {
      x: 0,
      y: 0,
      width: format[0],
      height: format[1],
    })
  }

  return doc.output('blob')
}
