/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDecadeImage } from './services/geminiService';
import PolaroidCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import { useMediaQuery } from './hooks/useMediaQuery';
import { createVideoFromImages } from './lib/videoUtils';

const DECADES = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s', '2030s', '2040s', '2050s'];

// Base64 data URL for the logo image to be used for the 2030s generation
const LOGO_AA_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIbGNtcwIQAABtbnRyUkdCIFhZWiAH4gADABQACQAOAB1hY3NwTVNGVAAAAABzYXdzY3RybAAAAAAAAAAAAAAAAAAAAAAA9tYAAQAAAADTLWhhbmQAAAAAAAAAAAAAAAACdHh0AAAAAENvcHlyaWdodCAoYykgMTk5OCBIZXdsZXR0LVBhY2thcmQgQ29tcGFueQAAZGVzYwAAAAAAAAARc1JHQiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAABJzUkdCIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWFlaIAAAAAAAAPNRAAEAAAABFsxYWVogAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z2Rlc2MAAAAAAAAAFklFQyBodHRwOi8vd3d3LmllYy5jaAAAAAAAAAAAAAAAFklFQyBodHRwOi8vd3d3LmllYy5jaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkZXNjAAAAAAAAAC5JRUMgNjE5NjYtMi4xIERlZmF1bHQgUkdCIGNvbG91ciBzcGFjZSAtIHNSR0IAAAAAAAAAAAAAAC5JRUMgNjE5NjYtMi4xIERlZmF1bHQgUkdCIGNvbG91ciBzcGFjZSAtIHNSR0IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGVzYwAAAAAAAAAsUmVmZXJlbmNlIFZpZXdpbmcgQ29uZGl0aW9uIGluIElFQzYxOTY2LTIuMQAAAAAAAAAAAAAALFJlZmVyZW5jZSBWaWV3aW5nIENvbmRpdGlvbiBpbiBJRUM2MTk2Ni0yLjEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB2aWV3AAAAAAATpP4AFF8uABDPFAAD7cwABBMLAANcngAAAAFYWVogAAAAAABMCVYAUAAAAFcf521lYXMAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAKPAAAAAnNpZyAAAAAAQ1JUIGN1cnYAAAAAAAAEAAAAAAUACgAPABQAGQAeACMAKAAtADIANwA7AEAARQBKAE8AVABZAF4AYwBoAG0AcgB3AHwAgQCGAIsAkACVAJoAnwCkAKZA_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_DQANWg1/DfoOBg5oDrIO+A80D4APsA/wEBAQGBDYEYwSABNkE8wVqBfUGNQZvBq8G4wcJBzIHUwevB/IIFghYCHoIxwjSCSoJaAmxCccKAQqwCusLGgsdC38L+AzIDM4M9w1GDWINfQ3UDf8OFA5MDqYO7g83D5YPsQ//EBAQEBAUHBBcGJwcJBwsMDQ4QERITFBUXGBkaGxwdHh8gJCUnKy4zNjc4OTpDUVNXWVlbXF5iZ2pwgYGHh5ieoqeoqaqtsbW3uLm6v8DBwsPExcbHyMnKzM3Nzs_R0tPU1tfo6err7O3u7_Dx8vP09fb3+Pn6-_z9_v_/_wADBAAFAAcACAAJAAoACwAMAA0ADgAPABAACQAKAAoACgAKAAoACwALAAwADAAOAA8AFAAXABoAHAAdAB8AIQAlACcAIAAkACQAJQAoACgALAApAC0ALgAwADIALwAyADMAOAA5ADwAPwA_AD8APQA9ADgANQAxAC0AJgAfABoAFQAQAAwACgAIAAQAAgABAQECAwQFBgcICQoLDQ4PEBESExQVFhkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzU2Nzg5Ojs8Pj9AQUJDREVGR0hJSktMTk9QUVJTVFVWV1hZWltcXV5fYGBjZGVnaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSlaCio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr_AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfa29zd3t_g4eLj5OXm5_jp6uvs7e7v8PHy8_T19vf5+fr7_P3+//8AAgECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSlaCjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs_R0tPU1dbX2Nvc3d7f4OHi4+Tl5ufo6err7O3u7_Dx8vP09fb3+Pn6+/z9_v__AAAABgADBAECAgQEAgcFBggECAkKCQcKDAwKCw4MCg4PERAPEBEQDxESExUUEhUTFRMVFRQWFRUWGRgXGBkZGhkaGxoZHBsdHBwdHh0dHh4fHh4gHyAfIB8gHyAgICEgISAhICEiIiMjIiMiJCMkIyQjJCMlJSYlJiUmJSUmJSYnKCgoKSgoKSgpKSoqKSsqKyoqLCwsLCwsLiwrLjAuMTMxNTY4Ozw9P0FEQ0ZJS1xdYmNlZ2lrb3F0eXp8f4KEhYiKi46QkpWYnKOlqKywuMLGy9DR1dfZ3uPl6O3v9Pf6_P__AwUEAwECAQAAAgQFAwYHAwUHCQgKCQwMCw4NDg8RDw8QEhMTEhQTFRYWGBkaGRscHB4dHyAgISIjJiUmKCkqKy0uLzAyMzQ1Nzg5Ojs8Pj9BQUJERUZHSUlKS0xOT1BUVFZXWFlaW11eX2BhY2RlZmhpamtsbm9wcXN0dXZ4eXp8fX5_gIGDhIWGh4mKi4yNjpCRk5WXmJqbnZ6foqOkpaanqqusra+wsbKztLa3uLm7vL2_wMLDxMXGx8nKy8zNztHS09XW19jb3N3e4OLj5OXm5_jp6uvt7vDx8vP09fb4+vv8_QABAAIAAQAAAAEAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQABAAIAAQAB-P/hAAQBAQABAwABAQEAAAAAAAAAAgEBAwQABQYH/2gAIAQEAAAAA_gQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQEBgQ-P/hAAIVFhQdFRgVGxQYGxkfHCYeJycrLDAxMjM0NTY3ODk6PklKTVFVWFlaW11eX2NnaHF2e4CBhIeJi5SWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7S1tre4ubq7vL2-v8DBwsPExcbHyMnKzM3O0NHS09TV1tfY2drf4OLj5OXm5-jp6uvs7e7v8PHy8_T19vf4-fr7_P3-_wAIAQMAAwQFBgcICQoLDQ4PEBESExQVFhkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzU2Nzg5Ojs8Pj9AQUJDREVGR0hJSktMTk9QUVJTVFVWV1hZWltcXV5fYGBjZGVnaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn-AgYKDhIWGh4iJiouMjY6PkJGSlaCio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr_AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfa29zd3t_g4eLj5OXm5-jp6uvs7e7v8PHy8_T19vf5-fr7_P3-_wABAwIBCgoEBQcICQoLDQ4PEBESExQVFhkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzU2Nzg5Ojs8Pj9AQUJDREVGR0hJSktMTk9QUVJTVFVWV1hZWltcXV5fYGBjZGVnaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn-AgYKDhIWGh4iJiouMjY6PkJGSlaCjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2-v8DBwsPExcbHyMnKy8zNzs_R0tPU1dbX2Nvc3d7f4OHi4-Tl5ufo6err7O3u7_Dx8vP09fb3-Pn6-_z9_v_/_wABBAIBAwMFAwMDAwMDAgMCAwQABQYHCAkKCwwNDg8QERITFBUWGCIyFBcZGxwdHh8tJSYnKCkqKywtLi8wMjM0NTY3ODk6OzxFRkZISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1-f4CBgoOEhYaHiImKi4yNjo-QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr_AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfa29zd3t_g4eLj5OXm5-jp6uvs7e7v8PHy8_T19vf4-fr7_P3-_wAEBQgGBwIDAQQDBgUHCAkKCwwNDg8QERITFBUWFxkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzU2Nzg5Ojs8Pj9AQUJDREVGR0hJSktMTk9QUVJTVFVWV1hZWltcXV5fYGBjZGVnaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn-AgYKDhIWGh4iJiouMjY6PkJGSlaCio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr_AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfa29zd3t_g4eLj5OXm5-jp6uvs7e7v8PHy8_T19vf5-fr7_P3-_wABAwACAgICAgICAgICAgICAgID_wAARCAA5AIQDAREAAhEBAxEB_8QATwAAAgIDAQEBAAAAAAAAAAAAAwUGAgEHCAQKAQEBAQEAAQUAAAAAAAAAAAAAAgECAwQFBhAAAQIFAwQCAgEFAAAAAAAAAAECABEDBCESBTFBE1FhIjIUBWJxkaFSMoKxwRQAQACAQIGAgMBAQAAAAAAAAAAAQIRA3ESMVEhQVMEIiMzYXGBkaHwBDIw8YGRobIHFyTh8oJTQ1M0orLCY3ODk6QUVLRklPW1doX212cHuAhoYnKC4iLzNf_9oADAMBAAIRAxEAAAG2YgZ1zJ59e7HqKjE59qL3f82R33TqT0gq99R9jB7aV6y3zB99z3-Y0rK-Uvo6H5m9e-s3W4q133_OqF0n0U2qN_43v8Alx6O49M_m9O6lq_n0a9f5d_7_P785iZgZ2E9bXp099m6qNnI9Tf-hJ8tH-l_wAtc6jF7U535s_Q_5tBv_74jD035u-0L_ADm3-q4_O9H6U-Jm-tXl-oM1-L7M5m-sI5-N8p2c_y3d1m-rI-j_A-m0w_n_68uDk-s19b_AOdm3-D6-W-16_K4iYmJiZnYwMyIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi-P_2gAIAQIAAQUAefSPz6X2Mf_aAAgBAwABBQA-_efX6jxX-H_2gAIAQEAAQUALeNlJjUuRDTq4b_AO3oYv_tF3-lI1HnJ0s6r_a-07r_AP-07n8xQ8t-g6QfJ1v4u21h-t_P-L7d29_G-07l1H5_Q_wDeH81f93f-07t77W-X_0-L_2gAIAQECAgY_AGr_2gAIAQMCBgYA1f_aAAgBAQEGPwDzz2204tI2V3c8d-O8-V7P_AE93K__aAAgBAgMBPwB_2gAIAQMDAT8Af__Z';

/**
 * Returns a specific, creative prompt for a given decade.
 * @param decade The decade string (e.g., "1950s").
 * @returns The prompt string.
 */
const getPromptForDecade = (decade: string): string => {
    const basePrompt = `Reimagine the person in this photo in the style of the ${decade}. This includes clothing, hairstyle, photo quality, and the overall aesthetic of that decade. The output must be a photorealistic image showing the person clearly.`;

    const creativePrompts: Record<string, string> = {
        '2010s': `Recreate this photo with the classic ${decade} "Instagram" aesthetic. Think high-contrast, faded filters, a casual candid pose, and fashion like skinny jeans or floral prints. The photo should look like it was taken on an early smartphone.`,
        '2020s': `Generate a photorealistic image of this person in the style of the ${decade}. Capture the modern, clean, high-resolution look of today's photography. Include contemporary fashion trends and a natural, authentic expression.`,
        '2030s': `Project this person into the ${decade}. Imagine a near-future aesthetic with subtle integrated technology in their clothing. The person is wearing a stylish, minimalist t-shirt featuring the attached logo prominently on the chest. The photo should have a sharp, slightly futuristic and optimistic feel.`,
        '2040s': `Envision this person in the cyberpunk world of the ${decade}. The style should be gritty and futuristic, with neon-lit surroundings casting colorful reflections on their tech-infused clothing and accessories. Create a photorealistic, cinematic image.`,
        '2050s': `Transport this person to the sleek, utopian world of the ${decade}. They are in a minimalist, eco-futurist environment with clean lines and advanced technology seamlessly blended with nature. Their clothing is functional yet elegant, made from advanced smart fabrics. The image should be photorealistic, bright, and hopeful.`,
    };
    return creativePrompts[decade] || basePrompt;
};

// Pre-defined positions for a scattered look on desktop
const POSITIONS = [
    { top: '2%', left: '10%', rotate: -8 },   // 1950s
    { top: '5%', left: '40%', rotate: 5 },    // 1960s
    { top: '3%', left: '70%', rotate: 10 },   // 1970s
    { top: '25%', left: '20%', rotate: -12 }, // 1980s
    { top: '28%', left: '55%', rotate: 3 },   // 1990s
    { top: '30%', left: '80%', rotate: -7 },  // 2000s
    { top: '50%', left: '5%', rotate: 6 },    // 2010s
    { top: '55%', left: '35%', rotate: -4 },  // 2020s
    { top: '52%', left: '68%', rotate: 9 },   // 2030s
    { top: '75%', left: '25%', rotate: -11 }, // 2040s
    { top: '78%', left: '58%', rotate: 13 },  // 2050s
];

const GHOST_POLAROIDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}

type AppState = 'idle' | 'image-uploaded' | 'generating' | 'results-shown' | 'generating-video' | 'video-shown';

const primaryButtonClasses = "font-permanent-marker text-xl text-center text-black bg-yellow-400 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:-rotate-2 hover:bg-yellow-300 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.2)]";
const secondaryButtonClasses = "font-permanent-marker text-xl text-center text-white bg-white/10 backdrop-blur-sm border-2 border-white/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:rotate-2 hover:bg-white hover:text-black";

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-8 w-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);


function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImage>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isVideoGenerating, setIsVideoGenerating] = useState<boolean>(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoGenerationMessage, setVideoGenerationMessage] = useState<string>('');
    const [appState, setAppState] = useState<AppState>('idle');
    const dragAreaRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const appTitle = "Time LINE";

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages({}); // Clear previous results
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateClick = async () => {
        if (!uploadedImage) return;

        setIsLoading(true);
        setAppState('generating');
        
        const initialImages: Record<string, GeneratedImage> = {};
        DECADES.forEach(decade => {
            initialImages[decade] = { status: 'pending' };
        });
        setGeneratedImages(initialImages);

        const concurrencyLimit = 1; // Process one decade at a time to avoid rate limits
        const decadesQueue = [...DECADES];

        const processDecade = async (decade: string) => {
            try {
                const prompt = getPromptForDecade(decade);
                const logo = decade === '2030s' ? LOGO_AA_BASE64 : undefined;
                const resultUrl = await generateDecadeImage(uploadedImage, prompt, logo);
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'done', url: resultUrl },
                }));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setGeneratedImages(prev => ({
                    ...prev,
                    [decade]: { status: 'error', error: errorMessage },
                }));
                console.error(`Failed to generate image for ${decade}:`, err);
            }
        };

        const workers = Array(concurrencyLimit).fill(null).map(async () => {
            while (decadesQueue.length > 0) {
                const decade = decadesQueue.shift();
                if (decade) {
                    await processDecade(decade);
                }
            }
        });

        await Promise.all(workers);

        setIsLoading(false);
        setAppState('results-shown');
    };

    const handleRegenerateDecade = async (decade: string) => {
        if (!uploadedImage) return;

        if (generatedImages[decade]?.status === 'pending') {
            return;
        }
        
        console.log(`Regenerating image for ${decade}...`);

        setGeneratedImages(prev => ({
            ...prev,
            [decade]: { status: 'pending' },
        }));

        try {
            const prompt = getPromptForDecade(decade);
            const logo = decade === '2030s' ? LOGO_AA_BASE64 : undefined;
            const resultUrl = await generateDecadeImage(uploadedImage, prompt, logo);
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'done', url: resultUrl },
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => ({
                ...prev,
                [decade]: { status: 'error', error: errorMessage },
            }));
            console.error(`Failed to regenerate image for ${decade}:`, err);
        }
    };
    
    const handleReset = () => {
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }
        setUploadedImage(null);
        setGeneratedImages({});
        setVideoUrl(null);
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (decade: string) => {
        const image = generatedImages[decade];
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `timeline-${decade}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const imageData = Object.entries(generatedImages)
                .filter(([, image]) => image.status === 'done' && image.url)
                .reduce((acc, [decade, image]) => {
                    acc[decade] = image!.url!;
                    return acc;
                }, {} as Record<string, string>);

            if (Object.keys(imageData).length < DECADES.length) {
                alert("Please wait for all images to finish generating before downloading the album.");
                return;
            }

            const albumDataUrl = await createAlbumPage(imageData);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'timeline-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCreateVideoTimeline = async () => {
        const completedImages = Object.entries(generatedImages)
            .filter(([, image]) => image.status === 'done' && image.url)
            .reduce((acc, [decade, image]) => {
                acc[decade] = { url: image.url! };
                return acc;
            }, {} as Record<string, { url: string }>);

        if (Object.keys(completedImages).length === 0) {
            alert("No images have been generated yet!");
            return;
        }

        setAppState('generating-video');
        setIsVideoGenerating(true);
        
        try {
            const videoBlob = await createVideoFromImages(completedImages, (message) => {
                setVideoGenerationMessage(message);
            });
            const url = URL.createObjectURL(videoBlob);
            setVideoUrl(url);
            setAppState('video-shown');
        } catch (error) {
            console.error("Failed to generate video:", error);
            alert("Sorry, there was an error creating your video timeline. Please try again.");
            setAppState('results-shown');
        } finally {
            setIsVideoGenerating(false);
        }
    };

    const handleDownloadVideo = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = 'timeline-video.webm';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="bg-black text-neutral-200 min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05]"></div>
            
            <div className="z-10 flex flex-col items-center justify-center w-full h-full flex-1 min-h-0">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-caveat font-bold text-neutral-100 overflow-hidden py-2">
                         {appTitle.split("").map((char, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: "0%" }}
                                transition={{
                                    delay: appState === 'idle' ? 2.0 + index * 0.05 : index * 0.05,
                                    type: 'spring',
                                    damping: 15,
                                    stiffness: 100
                                }}
                                style={{ display: 'inline-block', whiteSpace: 'pre' }}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: appState === 'idle' ? 2.5 : 0.5 }}
                        className="font-permanent-marker text-neutral-300 mt-2 text-xl tracking-wide"
                    >
                        Generate yourself through the decades.
                    </motion.p>
                </div>

                {appState === 'idle' && (
                     <div className="relative flex flex-col items-center justify-center w-full">
                        {/* Ghost polaroids for intro animation */}
                        {GHOST_POLAROIDS_CONFIG.map((config, index) => (
                             <motion.div
                                key={index}
                                className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-100/10 blur-sm"
                                initial={config.initial}
                                animate={{
                                    x: [`${(Math.random() - 0.5) * 50}px`, config.initial.x],
                                    y: [`${(Math.random() - 0.5) * 50}px`, config.initial.y],
                                    rotate: (Math.random() - 0.5) * 20,
                                    opacity: [1, 0],
                                    scale: [1, 0.5],
                                }}
                                transition={{
                                    ...config.transition,
                                    duration: 2.5,
                                    ease: "easeInOut",
                                    times: [0.8, 1], // Stay visible until 80% of duration, then exit
                                }}
                            />
                        ))}
                        <motion.div
                             initial={{ opacity: 0, scale: 0.8 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: 2.8, duration: 0.8, type: 'spring' }}
                             className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                 <PolaroidCard 
                                     caption="Click to begin"
                                     status="done"
                                 />
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <p className="mt-8 font-permanent-marker text-neutral-500 text-center max-w-xs text-lg">
                                Trace your face through time.
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="flex flex-col items-center gap-6">
                         <PolaroidCard 
                            imageUrl={uploadedImage} 
                            caption="Your Photo" 
                            status="done"
                         />
                         <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Different Photo
                            </button>
                            <button onClick={handleGenerateClick} className={primaryButtonClasses}>
                                Generate
                            </button>
                         </div>
                    </div>
                )}

                {(appState === 'generating' || appState === 'results-shown') && (
                     <>
                        {isMobile ? (
                            <div className="w-full max-w-sm flex-1 overflow-y-auto mt-4 space-y-8 p-4">
                                {DECADES.map((decade) => (
                                    <div key={decade} className="flex justify-center">
                                         <PolaroidCard
                                            caption={decade}
                                            status={generatedImages[decade]?.status || 'pending'}
                                            imageUrl={generatedImages[decade]?.url}
                                            error={generatedImages[decade]?.error}
                                            onShake={handleRegenerateDecade}
                                            onDownload={handleDownloadIndividualImage}
                                            isMobile={isMobile}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div ref={dragAreaRef} className="relative w-full max-w-6xl h-[800px] mt-4">
                                {DECADES.map((decade, index) => {
                                    const { top, left, rotate } = POSITIONS[index % POSITIONS.length];
                                    return (
                                        <motion.div
                                            key={decade}
                                            className="absolute cursor-grab active:cursor-grabbing"
                                            style={{ top, left }}
                                            initial={{ opacity: 0, scale: 0.5, y: 100, rotate: 0 }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1, 
                                                y: 0,
                                                rotate: `${rotate}deg`,
                                            }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 }}
                                        >
                                            <PolaroidCard 
                                                dragConstraintsRef={dragAreaRef}
                                                caption={decade}
                                                status={generatedImages[decade]?.status || 'pending'}
                                                imageUrl={generatedImages[decade]?.url}
                                                error={generatedImages[decade]?.error}
                                                onShake={handleRegenerateDecade}
                                                onDownload={handleDownloadIndividualImage}
                                                isMobile={isMobile}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                         <div className="h-20 mt-4 flex items-center justify-center">
                            {appState === 'results-shown' && (
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <button
                                        onClick={handleCreateVideoTimeline}
                                        disabled={isVideoGenerating}
                                        className={`${primaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Create Video Timeline
                                    </button>
                                    <button 
                                        onClick={handleDownloadAlbum} 
                                        disabled={isDownloading} 
                                        className={`${secondaryButtonClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating Album...' : 'Download Album'}
                                    </button>
                                    <button onClick={handleReset} className={secondaryButtonClasses}>
                                        Start Over
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {appState === 'generating-video' && (
                     <motion.div 
                        className="flex flex-col items-center justify-center text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                     >
                        <LoadingSpinner />
                        <p className="mt-4 font-permanent-marker text-neutral-300 text-xl tracking-wide w-64 h-12">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={videoGenerationMessage}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {videoGenerationMessage}
                                </motion.span>
                            </AnimatePresence>
                        </p>
                     </motion.div>
                )}

                {appState === 'video-shown' && videoUrl && (
                     <motion.div 
                        className="flex flex-col items-center justify-center gap-6"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <video 
                            src={videoUrl} 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full max-w-lg max-h-[80vh] rounded-lg shadow-2xl border-4 border-neutral-100"
                        />
                        <div className="flex items-center gap-4 mt-4">
                            <button onClick={handleDownloadVideo} className={primaryButtonClasses}>
                                Download Video
                            </button>
                            <button onClick={handleReset} className={secondaryButtonClasses}>
                                Start Over
                            </button>
                         </div>
                    </motion.div>
                )}

            </div>
        </main>
    );
}

export default App;