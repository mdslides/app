import jsPDF from 'jspdf'
import { elementToSVG } from 'dom-to-svg'

import 'svg2pdf.js'

import mulishBoldFont from '../fonts/mulishBold'
import mulishBoldItalicFont from '../fonts/mulishBoldItalic'
import mulishRegularFont from '../fonts/mulishRegular'
import mulishRegularItalicFont from '../fonts/mulishRegularItalic'

const format = [1200, 900]

export const createPdf = async (pages: HTMLCollection) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format,
  })

  doc.deletePage(1)
  doc.addFileToVFS('MulishBold.ttf', mulishBoldFont)
  doc.addFileToVFS('MulishBoldItalic.ttf', mulishBoldItalicFont)
  doc.addFileToVFS('MulishRegular.ttf', mulishRegularFont)
  doc.addFileToVFS('MulishRegularItalic.ttf', mulishRegularItalicFont)
  doc.addFont('MulishBold.ttf', 'Mulish', 'normal', 700)
  doc.addFont('MulishBoldItalic.ttf', 'Mulish', 'italic', 700)
  doc.addFont('MulishRegular.ttf', 'Mulish', 'normal', 400)
  doc.addFont('MulishRegularItalic.ttf', 'Mulish', 'italic', 400)

  for (const child of pages) {
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
