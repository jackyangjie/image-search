# AI 相册搜索 APP - 代码规范

## 文档信息

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 |
| 最后更新 | 2026-04-04 |
| 作者 | AI助手 |

---

## 目录

1. [项目结构](#1-项目结构)
2. [命名规范](#2-命名规范)
3. [代码风格](#3-代码风格)
4. [TypeScript 规范](#4-typescript-规范)
5. [组件规范](#5-组件规范)
6. [文件组织](#6-文件组织)
7. [注释规范](#7-注释规范)
8. [提交规范](#8-提交规范)

---

## 1. 项目结构

### 1.1 目录结构

```
smart-photo-search/
├── .github/                    # GitHub 配置
│   └── workflows/              # CI/CD 工作流
├── android/                    # Android 原生代码
├── ios/                        # iOS 原生代码
├── src/
│   ├── api/                    # API 层（类型定义）
│   │   └── types.ts            # 全局类型定义
│   ├── components/             # 公共组件
│   │   ├── ui/                 # UI 基础组件
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   └── Input/
│   │   ├── common/             # 业务通用组件
│   │   │   ├── PhotoCard/
│   │   │   ├── PhotoGrid/
│   │   │   ├── SearchBar/
│   │   │   └── EmptyState/
│   │   └── index.ts            # 组件统一导出
│   ├── constants/              # 常量定义
│   │   ├── colors.ts           # 颜色常量
│   │   ├── dimensions.ts       # 尺寸常量
│   │   ├── routes.ts           # 路由常量
│   │   └── storage-keys.ts     # 存储键名
│   ├── context/                # React Context
│   │   ├── AppContext.tsx      # 全局状态
│   │   └── ThemeContext.tsx    # 主题状态
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── usePhotos.ts
│   │   ├── useSearch.ts
│   │   ├── useScanner.ts
│   │   └── usePermission.ts
│   ├── navigation/             # 导航配置
│   │   ├── AppNavigator.tsx    # 根导航
│   │   ├── MainTabNavigator.tsx # Tab 导航
│   │   └── types.ts            # 导航类型
│   ├── screens/                # 页面组件
│   │   ├── SearchScreen/
│   │   │   ├── index.tsx
│   │   │   ├── styles.ts
│   │   │   └── types.ts
│   │   ├── GalleryScreen/
│   │   │   ├── index.tsx
│   │   │   ├── styles.ts
│   │   │   └── types.ts
│   │   └── PhotoDetailScreen/
│   │       ├── index.tsx
│   │       ├── styles.ts
│   │       └── types.ts
│   ├── services/               # 服务层
│   │   ├── ai/
│   │   │   ├── AIService.ts
│   │   │   └── types.ts
│   │   ├── db/
│   │   │   ├── DBService.ts
││   │   │   └── schema.ts
│   │   ├── scanner/
│   │   │   ├── ScannerService.ts
│   │   │   └── types.ts
│   │   ├── photo/
│   │   │   ├── PhotoService.ts
│   │   │   └── types.ts
│   │   ├── search/
│   │   │   ├── SearchService.ts
│   │   │   └── types.ts
│   │   └── permission/
│   │       ├── PermissionService.ts
│   │       └── types.ts
│   ├── theme/                  # 主题配置
│   │   ├── index.ts
│   │   ├── light.ts
│   │   └── dark.ts
│   ├── types/                  # 全局类型
│   │   ├── photo.ts
│   │   ├── search.ts
│   │   └── scan.ts
│   ├── utils/                  # 工具函数
│   │   ├── logger.ts           # 日志工具
│   │   ├── storage.ts          # 存储工具
│   │   ├── date.ts             # 日期工具
│   │   ├── image.ts            # 图片工具
│   │   ├── vector.ts           # 向量计算
│   │   └── validators.ts       # 校验工具
│   └── App.tsx                 # 应用入口
├── assets/                     # 静态资源
│   ├── images/
│   ├── fonts/
│   └── models/                 # AI 模型文件
├── doc/                        # 文档
├── tests/                      # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .eslintrc.js                # ESLint 配置
├── .prettierrc                 # Prettier 配置
├── tsconfig.json               # TypeScript 配置
├── package.json
└── README.md
```

### 1.2 文件命名规范

| 类型 | 命名方式 | 示例 |
|------|---------|------|
| 组件文件 | PascalCase | `SearchBar.tsx`, `PhotoCard.tsx` |
| 组件文件夹 | PascalCase | `SearchBar/`, `PhotoCard/` |
| 工具文件 | camelCase | `logger.ts`, `storage.ts` |
| 常量文件 | camelCase | `colors.ts`, `routes.ts` |
| 类型文件 | camelCase | `photo.ts`, `search.ts` |
| 样式文件 | camelCase | `styles.ts` |
| 测试文件 | camelCase + .test | `SearchBar.test.tsx` |
| 快照文件 | PascalCase + .snap | `SearchBar.snap.tsx` |

---

## 2. 命名规范

### 2.1 TypeScript 命名

| 类型 | 命名方式 | 示例 |
|------|---------|------|
| 类名 | PascalCase | `class AIService {}` |
| 接口名 | PascalCase + 前缀 I(可选) | `interface Photo {}`, `interface IService {}` |
| 类型别名 | PascalCase | `type SearchResult = ...` |
| 枚举名 | PascalCase | `enum ScanStatus {}` |
| 枚举成员 | PascalCase | `ScanStatus.Idle`, `ScanStatus.Scanning` |
| 函数名 | camelCase | `function encodeImage() {}` |
| 变量名 | camelCase | `const photoCount = 0` |
| 常量 | UPPER_SNAKE_CASE | `const MAX_PHOTOS = 10000` |
| 私有属性 | _camelCase | `private _instance: AIService` |
| 泛型参数 | T + 描述 | `T`, `TPhoto`, `TProps` |

### 2.2 React 命名

| 类型 | 命名方式 | 示例 |
|------|---------|------|
| 组件名 | PascalCase | `const SearchBar: React.FC<Props> = ...` |
| Props 接口 | PascalCase + Props | `interface SearchBarProps {}` |
| 组件 State | PascalCase + State | `interface SearchBarState {}` |
| Hook | use + PascalCase | `usePhotos()`, `useScanner()` |
| Context | PascalCase + Context | `const AppContext = ...` |
| Ref | PascalCase + Ref | `const searchInputRef = useRef<...>()` |

### 2.3 文件导出命名

```typescript
// ✅ 正确：默认导出与文件名一致
// SearchBar/index.tsx
export default function SearchBar() {}

// ✅ 正确：命名导出
export interface SearchBarProps {}
export const SearchBar: React.FC<SearchBarProps> = () => {}

// ❌ 错误：默认导出与文件名不一致
export default function SearchInput() {}
```

---

## 3. 代码风格

### 3.1 缩进与格式

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 3.2 引号与分号

```typescript
// ✅ 正确：使用单引号，结尾分号
const name = 'SmartPhoto';

// ❌ 错误：双引号，缺少分号
const name = "SmartPhoto"
```

### 3.3 行长度与换行

```typescript
// ✅ 正确：超过100字符换行
const longQuery = await dbService.searchByVector(
  embedding,
  20,
  threshold
);

// ✅ 正确：对象/数组多行时末尾逗号
const config = {
  batchSize: 10,
  concurrency: 2,
  generateThumbnail: true,
};

// ❌ 错误：行过长不换行
const longQuery = await dbService.searchByVector(embedding, 20, threshold, options, callback);

// ❌ 错误：缺少尾随逗号
const config = {
  batchSize: 10,
  concurrency: 2
};
```

### 3.4 空格规则

```typescript
// ✅ 正确：运算符周围有空格
const sum = a + b;
const result = x > 0 ? x : 0;

// ✅ 正确：逗号后面有空格
const arr = [1, 2, 3];
const obj = { a: 1, b: 2 };

// ✅ 正确：花括号内有空格
const obj = { key: 'value' };

// ❌ 错误：缺少空格
const sum=a+b;
const arr=[1,2,3];
const obj={key:'value'};
```

---

## 4. TypeScript 规范

### 4.1 类型定义

```typescript
// ✅ 正确：显式定义类型
interface Photo {
  id: number;
  filePath: string;
  createdAt: Date;
}

// ✅ 正确：使用类型别名
 type PhotoId = string;
 type PhotoList = Photo[];

// ❌ 错误：使用 any
const photo: any = {};

// ❌ 错误：隐式 any
function process(data) {
  return data.id;
}
```

### 4.2 接口与类型

```typescript
// ✅ 正确：对象结构使用 interface
interface Photo {
  id: number;
  filePath: string;
}

// ✅ 正确：联合类型、交叉类型使用 type
type PhotoStatus = 'indexed' | 'pending' | 'error';
type PhotoWithMeta = Photo & { meta: MetaData };

// ✅ 正确：函数类型使用 type
type PhotoHandler = (photo: Photo) => void;

// ❌ 错误：用 interface 定义联合类型
interface Status { 'indexed' | 'pending' }  // 错误！
```

### 4.3 泛型使用

```typescript
// ✅ 正确：泛型命名清晰
function filterArray<TItem>(
  items: TItem[],
  predicate: (item: TItem) => boolean
): TItem[] {
  return items.filter(predicate);
}

// ✅ 正确：泛型约束
interface Identifiable {
  id: string;
}

function findById<T extends Identifiable>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// ❌ 错误：泛型命名不清晰
function filterArray<T>(items: T[], fn: (x: T) => boolean): T[]
```

### 4.4 可选属性与 null

```typescript
// ✅ 正确：使用可选属性
interface Photo {
  id: number;
  thumbnailPath?: string;  // 可选
  width?: number;          // 可选
}

// ✅ 正确：使用 null 表示明确不存在
interface PhotoResult {
  photo: Photo | null;
  error: Error | null;
}

// ✅ 正确：使用 undefined 表示未设置
let cachedPhoto: Photo | undefined;

// ❌ 错误：同时使用可选和 | undefined
interface BadPhoto {
  path?: string | undefined;  // 冗余！
}
```

---

## 5. 组件规范

### 5.1 函数组件

```typescript
// ✅ 正确：使用函数声明
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  placeholder = '搜索照片...',
}: SearchBarProps): JSX.Element {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback(() => {
    onSearch(query);
  }, [onSearch, query]);

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        onSubmitEditing={handleSubmit}
      />
    </View>
  );
}

// ❌ 错误：使用 React.FC (已废弃)
const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {}
```

### 5.2 Props 定义

```typescript
// ✅ 正确：解构 props
interface PhotoCardProps {
  photo: Photo;
  onPress?: (photo: Photo) => void;
  onLongPress?: (photo: Photo) => void;
  selected?: boolean;
}

export function PhotoCard({
  photo,
  onPress,
  onLongPress,
  selected = false,
}: PhotoCardProps) {
  // ...
}

// ✅ 正确：children 类型
interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// ❌ 错误：使用 any 定义 props
function PhotoCard(props: any) {}
```

### 5.3 Hooks 使用规范

```typescript
// ✅ 正确：Hooks 在组件顶部调用
export function SearchScreen() {
  const { photos, search } = usePhotos();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  // ...
}

// ✅ 正确：useEffect 依赖完整
useEffect(() => {
  loadPhotos();
}, [loadPhotos]);  // 包含所有依赖

// ✅ 正确：useCallback 缓存回调
const handleSearch = useCallback((text: string) => {
  setQuery(text);
  search(text);
}, [search]);

// ❌ 错误：条件调用 Hook
if (condition) {
  useEffect(() => {});  // 错误！
}

// ❌ 错误：useEffect 缺少依赖
useEffect(() => {
  loadPhotos();
}, []);  // 缺少 loadPhotos！
```

### 5.4 样式规范

```typescript
// ✅ 正确：使用 StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});

// ✅ 正确：样式文件分离
// SearchScreen/styles.ts
export const styles = StyleSheet.create({...});

// SearchScreen/index.tsx
import { styles } from './styles';

// ❌ 错误：内联样式对象
<View style={{ flex: 1, padding: 16 }} />

// ❌ 错误：数组样式过多
<View style={[styles.container, props.style, dynamicStyle, anotherStyle]} />
```

---

## 6. 文件组织

### 6.1 导入顺序

```typescript
// ✅ 正确：导入分组，每组空一行
// 1. React / React Native
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. 第三方库
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

// 3. 绝对路径导入 (项目内部)
import { Photo } from '@/types/photo';
import { usePhotos } from '@/hooks/usePhotos';
import { SearchBar } from '@/components/common/SearchBar';
import { colors } from '@/constants/colors';

// 4. 相对路径导入
import { styles } from './styles';
import { SearchScreenProps } from './types';

// ❌ 错误：导入顺序混乱
import { View } from 'react-native';
import './styles';
import { usePhotos } from '@/hooks/usePhotos';
import React from 'react';
import { format } from 'date-fns';
```

### 6.2 导出规范

```typescript
// ✅ 正确：组件默认导出
// components/common/SearchBar/index.tsx
export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './types';

// ✅ 正确：统一导出
// components/index.ts
export { SearchBar } from './common/SearchBar';
export { PhotoGrid } from './common/PhotoGrid';
export { Button } from './ui/Button';

// ✅ 正确：命名空间导出
export * as Types from './types';
export * as Constants from './constants';
```

### 6.3 Barrel 文件

```typescript
// ✅ 正确：使用 index.ts 简化导入
// services/index.ts
export { AIService } from './ai/AIService';
export { DBService } from './db/DBService';
export { ScannerService } from './scanner/ScannerService';
export { SearchService } from './search/SearchService';

// 使用时
import { AIService, DBService } from '@/services';
```

---

## 7. 注释规范

### 7.1 文件头注释

```typescript
/**
 * @fileoverview SearchBar 组件 - 搜索输入栏
 * @description 提供搜索输入功能，支持自动完成和历史记录
 * @author AI助手
 * @since 1.0.0
 */

import React from 'react';
// ...
```

### 7.2 函数/方法注释

```typescript
/**
 * 搜索照片
 * @param query - 搜索关键词
 * @param options - 搜索选项
 * @returns 搜索结果列表
 * @throws {AIServiceError} AI 服务未初始化时抛出
 * @example
 * const results = await searchPhotos('海边的日落', { limit: 20 });
 */
async function searchPhotos(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  // ...
}
```

### 7.3 行内注释

```typescript
// ✅ 正确：解释 why 而不是 what
// 使用批处理减少数据库写入次数
await dbService.batchInsert(photos, { batchSize: 100 });

// ❌ 错误：解释显而易见的内容
// 设置 batchSize 为 100
const batchSize = 100;

// ✅ 正确：复杂逻辑的说明
// NOTE: 由于 ONNX 模型预热需要时间，这里使用 setImmediate
// 确保不会阻塞 UI 线程
setImmediate(() => {
  aiService.warmUp();
});
```

### 7.4 TODO 注释

```typescript
// TODO: 在 v1.1 中添加搜索历史持久化
// FIXME: 处理大图时可能出现的内存溢出问题
// HACK: 临时解决 iOS 上的权限弹窗延迟问题
```

---

## 8. 提交规范

### 8.1 Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 8.2 Type 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试相关 |
| chore | 构建/工具相关 |
| revert | 回滚 |

### 8.3 示例

```
feat(search): 添加相似图片搜索功能

- 实现 PhotoService.findSimilarPhotos()
- 添加相似度阈值配置
- 更新 UI 显示相似图片网格

Closes #123
```

```
fix(scanner): 修复扫描进度不更新的问题

扫描大相册时进度条卡住的原因是事件未正确触发
现在使用 EventBus 确保进度事件被正确分发

Fixes #456
```

```
docs(api): 更新 API 文档

- 添加 DBService 接口说明
- 补充错误码列表
- 更新使用示例
```

---

## 9. ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // React
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Import
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
      ],
      'newlines-between': 'always',
    }],
    
    // General
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
```

---

## 10. 最佳实践

### 10.1 性能优化

```typescript
// ✅ 正确：使用 memo 避免不必要渲染
export const PhotoCard = memo(function PhotoCard({
  photo,
  onPress,
}: PhotoCardProps) {
  // ...
});

// ✅ 正确：使用 useMemo 缓存计算
const sortedPhotos = useMemo(() => {
  return photos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}, [photos]);

// ✅ 正确：使用 FlatList 虚拟滚动
<FlatList
  data={photos}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### 10.2 错误处理

```typescript
// ✅ 正确：统一错误处理
try {
  await scannerService.startScan();
} catch (error) {
  if (error instanceof PermissionError) {
    showPermissionGuide();
  } else if (error instanceof AIError) {
    showToast('AI 服务异常，请重试');
    logger.error('AI service error', error);
  } else {
    showToast('操作失败，请重试');
    logger.error('Unexpected error', error);
  }
}

// ✅ 正确：使用 Result 类型
interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

async function safeScan(): Promise<Result<ScanResult>> {
  try {
    const result = await scannerService.startScan();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error };
  }
}
```

---

**文档版本**: v1.0  
**最后更新**: 2026-04-04  
**作者**: AI助手
