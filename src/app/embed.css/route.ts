export async function GET() {
  const css = `
#verbi-root .ma-body h1, #verbi-root .ma-body h2, #verbi-root .ma-body h3, #verbi-root .ma-body h4 { margin: 8px 0 4px; line-height: 1.3; }
#verbi-root .ma-body h1 { font-size: 20px; font-weight: 700; }
#verbi-root .ma-body h2 { font-size: 17px; font-weight: 700; }
#verbi-root .ma-body h3 { font-size: 15px; font-weight: 600; }
#verbi-root .ma-body h4 { font-size: 14px; font-weight: 600; }
#verbi-root .ma-body p { margin: 4px 0; }
#verbi-root .ma-body ul, #verbi-root .ma-body ol { margin: 4px 0; padding-left: 20px; }
#verbi-root .ma-body code { font-size: 13px; padding: 1px 4px; border-radius: 4px; }
`;

  return new Response(css, {
    headers: {
      "Content-Type": "text/css",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
