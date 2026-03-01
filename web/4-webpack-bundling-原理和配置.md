## Webpack Bundling 原理和配置

### 什麼是 Webpack

Webpack 是一個**模組打包器（Module Bundler）**，它將多個 JavaScript 文件（及其依賴）打包成一個或多個 bundle 文件，讓瀏覽器能夠高效載入。

**核心功能：**
- 模組化：支援 ES6 modules、CommonJS、AMD
- 代碼轉換：透過 Loaders 轉換各種文件類型
- 優化：代碼分割、壓縮、Tree Shaking
- 開發體驗：熱重載、Source Maps

### Webpack 的工作原理

```
源代碼
  │
  ├─ Entry（入口）
  │   └─ 分析依賴
  │
  ├─ Module Resolution（模組解析）
  │   ├─ 解析 import/require
  │   └─ 構建依賴圖
  │
  ├─ Loaders（載入器）
  │   ├─ babel-loader（轉譯 JS）
  │   ├─ css-loader（處理 CSS）
  │   └─ file-loader（處理文件）
  │
  ├─ Plugins（插件）
  │   ├─ 代碼分割
  │   ├─ 壓縮優化
  │   └─ HTML 生成
  │
  └─ Output（輸出）
      └─ Bundle 文件
```

### 核心概念

#### 1. Entry（入口）

**作用：** 指定 webpack 從哪個文件開始構建依賴圖。

```javascript
// webpack.config.js
module.exports = {
  // 單入口
  entry: './src/index.js',
  
  // 多入口
  entry: {
    main: './src/index.js',
    vendor: './src/vendor.js'
  },
  
  // 動態入口
  entry: () => {
    return {
      main: './src/index.js',
      admin: './src/admin.js'
    };
  }
};
```

**實際應用：**

```javascript
// 單頁應用（SPA）
module.exports = {
  entry: './src/index.js'
};

// 多頁應用（MPA）
module.exports = {
  entry: {
    home: './src/pages/home/index.js',
    about: './src/pages/about/index.js',
    contact: './src/pages/contact/index.js'
  }
};
```

#### 2. Output（輸出）

**作用：** 指定打包後的文件輸出位置和命名規則。

```javascript
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    // 輸出目錄
    path: path.resolve(__dirname, 'dist'),
    
    // 文件名（可以使用佔位符）
    filename: 'bundle.js',
    
    // 多入口時使用
    filename: '[name].bundle.js', // main.bundle.js, vendor.bundle.js
    
    // 帶 hash 的文件名（用於緩存）
    filename: '[name].[contenthash].js',
    
    // 公共路徑（CDN）
    publicPath: 'https://cdn.example.com/',
    
    // 清理輸出目錄
    clean: true
  }
};
```

**佔位符說明：**

```javascript
filename: '[name].[contenthash:8].js'
// [name] - 入口名稱（entry key）
// [id] - 模組 ID
// [hash] - 所有文件的 hash
// [chunkhash] - chunk 的 hash
// [contenthash] - 文件內容的 hash（推薦）
```

#### 3. Loaders（載入器）

**作用：** 讓 webpack 能夠處理非 JavaScript 文件，將其轉換為模組。

**工作原理：** 從右到左（或從下到上）執行。

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/, // 匹配文件
        use: 'babel-loader', // 使用的 loader
        exclude: /node_modules/ // 排除目錄
      },
      {
        test: /\.css$/,
        // 從右到左執行
        use: [
          'style-loader', // 3. 將 CSS 注入到 DOM
          'css-loader'    // 2. 解析 CSS
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader' // 1. 將 SCSS 轉換為 CSS
        ]
      }
    ]
  }
};
```

**常用 Loaders：**

```javascript
module.exports = {
  module: {
    rules: [
      // JavaScript 轉譯
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      
      // TypeScript
      {
        test: /\.tsx?$/,
        use: 'ts-loader'
      },
      
      // CSS
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      
      // CSS Modules
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          }
        ]
      },
      
      // 圖片
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource', // webpack 5
        // 或使用 file-loader
        // use: 'file-loader'
      },
      
      // 字體
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource'
      },
      
      // 數據文件
      {
        test: /\.(csv|tsv)$/,
        use: 'csv-loader'
      },
      {
        test: /\.xml$/,
        use: 'xml-loader'
      }
    ]
  }
};
```

#### 4. Plugins（插件）

**作用：** 執行更廣泛的任務，如打包優化、資源管理、環境變數注入等。

**常用 Plugins：**

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = {
  plugins: [
    // 清理輸出目錄
    new CleanWebpackPlugin(),
    
    // 生成 HTML 文件
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['main'], // 注入的 chunk
      minify: {
        removeComments: true,
        collapseWhitespace: true
      }
    }),
    
    // 提取 CSS 到單獨文件
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    }),
    
    // 環境變數
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.API_URL': JSON.stringify('https://api.example.com')
    }),
    
    // 提供全局變數
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};
```

### 常用配置

#### 開發環境配置

```javascript
// webpack.dev.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  
  entry: './src/index.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  
  // Source Maps（方便調試）
  devtool: 'eval-source-map',
  
  // 開發伺服器
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 3000,
    hot: true, // 熱重載
    open: true, // 自動打開瀏覽器
    historyApiFallback: true // SPA 路由支持
  },
  
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  
  // 解析配置
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components')
    }
  }
};
```

#### 生產環境配置

```javascript
// webpack.prod.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  
  entry: './src/index.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    clean: true,
    publicPath: '/'
  },
  
  // 生產環境使用 source-map
  devtool: 'source-map',
  
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { modules: false }] // 保留 ES modules
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, // 提取 CSS
          'css-loader'
        ]
      }
    ]
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true
      }
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css'
    })
  ],
  
  // 優化配置
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(), // 壓縮 JavaScript
      new CssMinimizerPlugin() // 壓縮 CSS
    ],
    
    // 代碼分割
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    
    // 運行時代碼單獨提取
    runtimeChunk: 'single'
  }
};
```

### 代碼分割（Code Splitting）

#### 為什麼需要代碼分割

- 減少初始 bundle 大小
- 按需載入，提升首屏載入速度
- 更好的緩存策略

#### 方法一：Entry Points

```javascript
module.exports = {
  entry: {
    index: './src/index.js',
    about: './src/about.js'
  },
  output: {
    filename: '[name].bundle.js'
  }
};
```

**問題：** 如果多個入口共享依賴，會重複打包。

#### 方法二：SplitChunksPlugin（推薦）

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all', // 'initial' | 'async' | 'all'
      
      // 最小 chunk 大小
      minSize: 20000,
      
      // 最大 chunk 大小
      maxSize: 244000,
      
      // 最小共享次數
      minChunks: 1,
      
      // 最大異步請求數
      maxAsyncRequests: 30,
      
      // 最大初始請求數
      maxInitialRequests: 30,
      
      // 自動命名分隔符
      automaticNameDelimiter: '~',
      
      cacheGroups: {
        // 第三方庫
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true
        },
        
        // React 相關
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20,
          reuseExistingChunk: true
        },
        
        // 公共代碼
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        },
        
        // 樣式文件
        styles: {
          test: /\.css$/,
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          enforce: true
        }
      }
    }
  }
};
```

#### 方法三：動態導入（Dynamic Import）

```javascript
// 使用 import() 語法
// src/index.js
async function loadModule() {
  const { default: _ } = await import('lodash');
  // 使用 lodash
}

// 路由級別分割
// React Router 範例
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

// webpack 會自動創建單獨的 chunk
```

### 優化策略

#### 1. Tree Shaking

**作用：** 移除未使用的代碼。

```javascript
// webpack.config.js
module.exports = {
  mode: 'production', // 自動啟用 Tree Shaking
  
  optimization: {
    usedExports: true, // 標記未使用的導出
    sideEffects: false // 告訴 webpack 沒有副作用
  }
};

// package.json
{
  "sideEffects": [
    "*.css",
    "./src/polyfills.js"
  ]
}
```

**使用 ES Modules：**

```javascript
// ✅ 支援 Tree Shaking
import { debounce } from 'lodash-es';

// ❌ 不支援 Tree Shaking
import _ from 'lodash';
```

#### 2. 緩存策略

```javascript
module.exports = {
  output: {
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js'
  },
  
  optimization: {
    moduleIds: 'deterministic', // 穩定的模組 ID
    runtimeChunk: 'single', // 運行時代碼單獨提取
    
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

#### 3. 壓縮優化

```javascript
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // 移除 console
            drop_debugger: true
          }
        },
        extractComments: false // 不提取註釋到單獨文件
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true }
            }
          ]
        }
      })
    ]
  }
};
```

#### 4. 解析優化

```javascript
module.exports = {
  resolve: {
    // 自動解析擴展名
    extensions: ['.js', '.jsx', '.json'],
    
    // 別名（減少路徑解析）
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'utils': path.resolve(__dirname, 'src/utils')
    },
    
    // 解析模組位置
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    
    // 優先使用 ES6 版本
    mainFields: ['browser', 'module', 'main']
  },
  
  // 排除不需要解析的模組
  module: {
    noParse: /jquery|lodash/
  }
};
```

#### 5. 構建性能優化

```javascript
module.exports = {
  // 使用緩存
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },
  
  // 並行處理
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'thread-loader',
            options: {
              workers: 2
            }
          },
          'babel-loader'
        ]
      }
    ]
  },
  
  // 排除不需要處理的文件
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
```

### 實際配置範例

#### React 項目配置

```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  
  entry: './src/index.js',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction 
      ? '[name].[contenthash:8].js'
      : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash:8].chunk.js'
      : '[name].chunk.js',
    publicPath: '/',
    clean: true
  },
  
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 3000,
    hot: true,
    historyApiFallback: true
  },
  
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: /\.module\.css$/
              }
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      }
    ]
  },
  
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: isProduction
    }),
    ...(isProduction ? [
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash:8].css'
      })
    ] : [])
  ],
  
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20
        }
      }
    },
    runtimeChunk: 'single'
  }
};
```

### Webpack 5 新特性

#### 1. Asset Modules

```javascript
// Webpack 4
{
  test: /\.(png|jpg)$/,
  use: 'file-loader'
}

// Webpack 5
{
  test: /\.(png|jpg)$/,
  type: 'asset/resource' // 自動選擇 asset/resource 或 asset/inline
}
```

#### 2. 持久化緩存

```javascript
module.exports = {
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  }
};
```

#### 3. Module Federation（微前端）

```javascript
// webpack.config.js (Host)
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remoteApp: 'remote@http://localhost:3001/remoteEntry.js'
      }
    })
  ]
};

// 使用
const RemoteComponent = React.lazy(() => import('remoteApp/Component'));
```

### 常見問題和解決方案

#### 1. 構建速度慢

```javascript
// 使用緩存
module.exports = {
  cache: {
    type: 'filesystem'
  },
  
  // 減少解析範圍
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  
  // 使用 thread-loader 並行處理
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['thread-loader', 'babel-loader']
      }
    ]
  }
};
```

#### 2. Bundle 體積過大

```javascript
// 分析 bundle
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin()
  ],
  
  // 代碼分割
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  
  // Tree Shaking
  optimization: {
    usedExports: true,
    sideEffects: false
  }
};
```

#### 3. 熱重載不工作

```javascript
module.exports = {
  devServer: {
    hot: true,
    liveReload: false // 關閉 live reload，只使用 HMR
  },
  
  // 確保使用正確的 loader
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'] // 開發環境使用 style-loader
      }
    ]
  }
};
```

### 總結

**Webpack 核心要點：**

1. **Entry → Output**
   - 從入口開始，構建依賴圖，輸出 bundle

2. **Loaders**
   - 轉換非 JavaScript 文件
   - 從右到左執行

3. **Plugins**
   - 執行更廣泛的任務
   - 在構建生命週期的不同階段執行

4. **代碼分割**
   - 減少初始 bundle 大小
   - 按需載入

5. **優化策略**
   - Tree Shaking
   - 緩存
   - 壓縮
   - 並行處理

**最佳實踐：**
- 使用 contenthash 實現長期緩存
- 代碼分割第三方庫和業務代碼
- 生產環境啟用 Tree Shaking
- 使用緩存提升構建速度
- 定期分析 bundle 大小

Webpack 是現代前端開發不可或缺的工具，理解其原理和配置對於優化應用性能至關重要。
