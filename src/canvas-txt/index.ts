// Hair space character for precise justification
const SPACE = '\u200a'

const SEPARATORS = [
  ' ',
  '•',
];

const canvasTxt = {
  debug: false,
  align: 'center',
  vAlign: 'middle',
  fontSize: 14,
  fontWeight: '',
  fontStyle: '',
  fontVariant: '',
  font: 'Arial',
  lineHeight: null,
  justify: false,
  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} mytext
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  drawText: function (
    ctx: CanvasRenderingContext2D,
    mytext: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    if (width <= 0 || height <= 0 || this.fontSize <= 0) {
      //width or height or font size cannot be 0
      return { height: 0 }
    }

    // End points
    const xEnd = x + width
    const yEnd = y + height

    const { fontStyle, fontVariant, fontWeight, fontSize, font } = this
    const style = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${font}`
    ctx.font = style

    let txtY = y + height / 2 + this.fontSize / 2

    let textanchor: number

    if (this.align === 'right') {
      textanchor = xEnd
      ctx.textAlign = 'right'
    } else if (this.align === 'left') {
      textanchor = x
      ctx.textAlign = 'left'
    } else {
      textanchor = x + width / 2
      ctx.textAlign = 'center'
    }

    //added one-line only auto linebreak feature
    let textarray: any[] = []
    let temptextarray = mytext.split('\n')

    const spaceMetrics = ctx.measureText(SPACE)
    const spaceWidth = this.justify ? spaceMetrics.actualBoundingBoxRight + spaceMetrics.actualBoundingBoxLeft : 0

    temptextarray.forEach((txtt) => {
      const texttMetrics = ctx.measureText(txtt)
      let textwidth = texttMetrics.actualBoundingBoxRight + texttMetrics.actualBoundingBoxLeft
      if (textwidth <= width) {
        textarray.push(txtt)
      } else {
        let temptext = txtt
        let linelen = width
        let textlen: number;
        let textpixlen
        let texttoprint
        const temptextMetrics = ctx.measureText(temptext)
        textwidth = temptextMetrics.actualBoundingBoxRight + temptextMetrics.actualBoundingBoxLeft;
        while (textwidth > linelen) {
          textlen = 0
          textpixlen = 0
          texttoprint = ''
          while (textpixlen < linelen) {
            textlen++
            texttoprint = temptext.substr(0, textlen)
            const texttoprintMetrics = ctx.measureText(texttoprint)
            textpixlen = texttoprintMetrics.actualBoundingBoxRight + texttoprintMetrics.actualBoundingBoxLeft
          }
          // Remove last character that was out of the box
          textlen--
          texttoprint = texttoprint.substr(0, textlen)
          //if statement ensures a new line only happens at a space, and not amidst a word
          const backup = textlen
          if (!SEPARATORS.includes(temptext.substr(textlen, 1))) {
            while (!SEPARATORS.includes(temptext.substr(textlen, 1)) && textlen != 0) {
              textlen--
            }
            if (textlen == 0) {
              textlen = backup
            }
            texttoprint = temptext.substr(0, textlen)

            // We found a separator, now we need to clean up all other separators
            texttoprint = this.removeCharactersFromEnd(texttoprint, SEPARATORS)
          }

          texttoprint = this.justify
            ? this.justifyLine(ctx, texttoprint, spaceWidth, SPACE, width)
            : texttoprint

          temptext = temptext.substr(textlen)
          const temptextMetrics2 = ctx.measureText(temptext)
          textwidth = temptextMetrics2.actualBoundingBoxRight + temptextMetrics2.actualBoundingBoxLeft;
          textarray.push(texttoprint)
        }
        if (textwidth > 0) {
          textarray.push(temptext)
        }
      }
      // end foreach temptextarray
    })
    const charHeight = this.lineHeight
      ? this.lineHeight
      : this.getTextHeight(ctx, mytext, style) //close approximation of height with width
    const vheight = charHeight * (textarray.length - 1)
    const negoffset = vheight / 2

    let debugY = y
    // Vertical Align
    if (this.vAlign === 'top') {
      txtY = y + this.fontSize
    } else if (this.vAlign === 'bottom') {
      txtY = yEnd - vheight
      debugY = yEnd
    } else {
      //defaults to center
      debugY = y + height / 2
      txtY -= negoffset
    }
    //print all lines of text
    let longestWidth = 0;
    textarray.forEach((txtline) => {
      txtline = txtline.trim()

      const textMetrics = ctx.measureText(txtline)
      let w = textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft;
      if (w > longestWidth) {
        longestWidth = w;
      }

      ctx.fillText(txtline, textanchor, txtY)
      txtY += charHeight
    })

    if (this.debug) {
      // Text box
      ctx.lineWidth = 3
      ctx.strokeStyle = '#00909e'
      ctx.strokeRect(x, y, width, height)

      ctx.lineWidth = 2
      // Horizontal Center
      ctx.strokeStyle = '#f6d743'
      ctx.beginPath()
      ctx.moveTo(textanchor, y)
      ctx.lineTo(textanchor, yEnd)
      ctx.stroke()
      // Vertical Center
      ctx.strokeStyle = '#ff6363'
      ctx.beginPath()
      ctx.moveTo(x, debugY)
      ctx.lineTo(xEnd, debugY)
      ctx.stroke()
    }

    const TEXT_HEIGHT = vheight + charHeight

    return { height: TEXT_HEIGHT, width: longestWidth }
  },
  // Calculate Height of the font
  getTextHeight: function (
    ctx: CanvasRenderingContext2D,
    text: string,
    style: string
  ) {
    const previousTextBaseline = ctx.textBaseline
    const previousFont = ctx.font

    ctx.textBaseline = 'bottom'
    ctx.font = style
    const { actualBoundingBoxAscent: height } = ctx.measureText(text)

    // Reset baseline
    ctx.textBaseline = previousTextBaseline
    ctx.font = previousFont

    return height
  },
  /**
   * This function will insert spaces between words in a line in order
   * to raise the line width to the box width.
   * The spaces are evenly spread in the line, and extra spaces (if any) are inserted
   * between the first words.
   *
   * It returns the justified text.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} line
   * @param {number} spaceWidth
   * @param {string} spaceChar
   * @param {number} width
   */
  justifyLine: function (
    ctx: CanvasRenderingContext2D,
    line: string,
    spaceWidth: number,
    spaceChar: string,
    width: number
  ) {
    const text = line.trim()

    const textMetrics = ctx.measureText(text)
    const lineWidth = textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft;

    const nbSpaces = text.split(/\s+/).length - 1
    const nbSpacesToInsert = Math.floor((width - lineWidth) / spaceWidth)

    if (nbSpaces <= 0 || nbSpacesToInsert <= 0) return text

    // We insert at least nbSpacesMinimum and we add extraSpaces to the first words
    const nbSpacesMinimum = Math.floor(nbSpacesToInsert / nbSpaces)
    let extraSpaces = nbSpacesToInsert - nbSpaces * nbSpacesMinimum

    let spaces: any[] | string = []
    for (let i = 0; i < nbSpacesMinimum; i++) {
      spaces.push(spaceChar)
    }
    spaces = spaces.join('')

    const justifiedText = text.replace(/\s+/g, (match) => {
      const allSpaces = extraSpaces > 0 ? spaces + spaceChar : spaces
      extraSpaces--
      return match + allSpaces
    })

    return justifiedText
  },
  removeCharactersFromEnd: function (
    str: string,
    characters: string[]
  ): string {
    let result = str;
    
    // Iterate over each character in the array
    for (let i = characters.length - 1; i >= 0; i--) {
      const char = characters[i];
      
      // Check if the last character of the result string matches the current character
      while (result.endsWith(char)) {
        // Remove the character from the end of the result string
        result = result.slice(0, result.length - 1);
      }
    }
    
    return result;
  }
}

export default canvasTxt
