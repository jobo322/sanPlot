export default {
  input: 'src/sanPlot.js',
  output: {
    format: 'cjs',
    file: 'lib/sanPlot.js',
    exports: 'named',
  },
  external: ['is-any-array'],
};
