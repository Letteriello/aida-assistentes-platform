module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Suporte para navegadores dos últimos 2 anos + IE 11
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'IE 11',
        'not dead'
      ],
      // Adiciona prefixos para propriedades CSS modernas
      grid: 'autoplace',
      flexbox: 'no-2009'
    },
    // Plugin para otimizar CSS para produção
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: false,
        }]
      }
    })
  },
}