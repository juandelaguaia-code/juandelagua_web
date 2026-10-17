// Con build.format 'file', Astro.url.pathname trae '.html' en el build. Esto lo normaliza.
export const cleanPath = (pathname: string) =>
  pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
