import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// jsdom (Jest 27) does not ship these, but react-router v7 requires them.
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}
