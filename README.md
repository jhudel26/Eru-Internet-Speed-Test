# Eru Internet Speed Test

A modern, professional internet speed test web application with accurate measurements and beautiful UI.

## Features

- **Accurate Speed Testing**: Optimized algorithms for download, upload, ping, and jitter measurement
- **Modern UI**: Glass morphism design with smooth animations
- **Responsive Design**: Works perfectly on all screen sizes
- **Real-time Progress**: Live updates during tests
- **Connection Info**: Displays IP, ISP, server location
- **No Dependencies**: Pure vanilla JavaScript

## Deployment

### Render.com

1. Push your code to GitHub
2. Connect your repository to Render.com
3. Select "Static Site" service type
4. Build command: (leave empty)
5. Publish directory: `.` (root)
6. Deploy!

The `render.yaml` file is included for easy configuration.

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Netlify

Simply drag and drop the folder or connect via Git.

## Performance Optimizations

- Optimized upload test with adaptive chunk sizing
- Multiple parallel connections for accurate measurement
- Speed sample averaging for stable results
- Efficient memory usage
- GPU-accelerated animations

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## License

MIT License
