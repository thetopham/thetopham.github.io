#!/usr/bin/env python3
"""Build the downloadable resume from views/resume.html.

Install dependencies: python3 -m pip install reportlab
Run from the repository root: python3 scripts/build_resume_pdf.py
Requires Liberation Sans (for example: apt install fonts-liberation).
Set RESUME_FONT_DIR if its .ttf files are installed elsewhere.
The HTML .resume-sheet is the content source; review the rendered PDF after edits.
"""
from pathlib import Path
import os
from xml.sax.saxutils import escape, quoteattr

from html.parser import HTMLParser
from dataclasses import dataclass, field
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate

@dataclass
class Element:
    name: str
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)

    def get(self, key, default=None):
        value = self.attrs.get(key, default)
        return value.split() if key == "class" and isinstance(value, str) else value

    def __getitem__(self, key):
        return self.attrs[key]

    def find_all(self, name, recursive=False):
        return [child for child in self.children if isinstance(child, Element) and child.name == name]


class ResumeParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Element("document")
        self.stack = [self.root]
        self.sheet = None

    def handle_starttag(self, tag, attrs):
        node = Element(tag, dict(attrs))
        self.stack[-1].children.append(node)
        if "resume-sheet" in node.get("class", []):
            self.sheet = node
        if tag not in {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].name == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "views/resume.html"
OUTPUT = ROOT / "resources/Matthew_Topham_Resume_AI_Systems.pdf"


def inline(node):
    if isinstance(node, str):
        return escape(str(node))
    content = "".join(inline(child) for child in node.children)
    if node.name == "br":
        return "<br/>"
    if node.name in {"strong", "b"}:
        return f"<b>{content}</b>"
    if node.name in {"em", "i"}:
        return f"<i>{content}</i>"
    if node.name == "a":
        return f'<link href={quoteattr(node["href"])}>{content}</link>'
    return content


def build():
    font_dir = Path(os.environ.get("RESUME_FONT_DIR", "/usr/share/fonts/truetype/liberation"))
    for name, filename in [("ResumeSans", "LiberationSans-Regular.ttf"),
                           ("ResumeSans-Bold", "LiberationSans-Bold.ttf"),
                           ("ResumeSans-Italic", "LiberationSans-Italic.ttf"),
                           ("ResumeSans-BoldItalic", "LiberationSans-BoldItalic.ttf")]:
        pdfmetrics.registerFont(TTFont(name, str(font_dir / filename)))
    pdfmetrics.registerFontFamily("ResumeSans", normal="ResumeSans", bold="ResumeSans-Bold",
                                  italic="ResumeSans-Italic", boldItalic="ResumeSans-BoldItalic")
    parser = ResumeParser()
    parser.feed(SOURCE.read_text(encoding="utf-8"))
    sheet = parser.sheet
    if sheet is None:
        raise ValueError("Missing .resume-sheet content source")
    base = dict(fontName="ResumeSans", fontSize=9.6, leading=12.0,
                textColor=colors.HexColor("#172033"), alignment=TA_LEFT,
                spaceAfter=4)
    styles = {
        "body": ParagraphStyle("body", **base),
        "name": ParagraphStyle("name", fontName="ResumeSans-Bold", fontSize=24,
                               leading=26, textColor=colors.black, spaceAfter=4),
        "title": ParagraphStyle("title", fontName="ResumeSans-Bold", fontSize=11,
                                leading=14, textColor=colors.HexColor("#234d86"), spaceAfter=4),
        "contact": ParagraphStyle("contact", **{**base, "fontSize":8.8, "leading":11, "spaceAfter":7}),
        "summary": ParagraphStyle("summary", **{**base, "spaceAfter":7}),
        "section": ParagraphStyle("section", fontName="ResumeSans-Bold", fontSize=10,
                                  leading=12, spaceBefore=8, spaceAfter=5,
                                  textColor=colors.HexColor("#234d86"), keepWithNext=True),
        "heading": ParagraphStyle("heading", fontName="ResumeSans-Bold", fontSize=10.2,
                                  leading=12, spaceBefore=2, spaceAfter=2,
                                  textColor=colors.black, keepWithNext=True),
        "meta": ParagraphStyle("meta", **{**base, "fontSize":8.7,"leading":10.5,
                                "textColor":colors.HexColor("#526078"), "spaceAfter":4, "keepWithNext":True}),
        "bullet": ParagraphStyle("bullet", **{**base, "leftIndent":10,"firstLineIndent":0,
                                   "bulletIndent":0,"spaceAfter":3}),
        "proof": ParagraphStyle("proof", **{**base,"fontSize":8.3,"leading":10,"spaceAfter":5}),
    }

    def paragraph(tag):
        cls = tag.get("class", [])
        key = {"h1":"name", "h2":"section", "h3":"heading", "li":"bullet"}.get(tag.name,"body")
        for classname, style in [("resume-title","title"),("resume-contact","contact"),
                                 ("resume-summary","summary"),("resume-meta","meta"),
                                 ("resume-proof","proof")]:
            if classname in cls:
                key = style
        text = inline(tag)
        if tag.name == "h2":
            text = text.upper()
        return Paragraph(text, styles[key], bulletText="•" if tag.name == "li" else None)

    def blocks(container):
        result=[]
        for tag in container.children:
            if isinstance(tag,str):
                continue
            if tag.name in {"h1","h2","h3","p"}:
                result.append(paragraph(tag))
            elif tag.name in {"ul","ol"}:
                result.extend(paragraph(li) for li in tag.find_all("li",recursive=False))
            elif tag.name=="article":
                result.append(KeepTogether(blocks(tag)))
            else:
                result.extend(blocks(tag))
        return result

    doc = SimpleDocTemplate(str(OUTPUT),pagesize=letter,
        rightMargin=38,leftMargin=38,topMargin=32,bottomMargin=30,
        title="Matthew Topham Resume",author="Matthew Topham",
        subject="AI systems, full-stack development, and spatial computing",
        pageCompression=1,invariant=1)
    doc.build(blocks(sheet))
    print(OUTPUT)


if __name__=="__main__":
    build()
