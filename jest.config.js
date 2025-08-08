

export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$|': 'identity-obj-proxy',
  },
  transform: {
    '^.+\.(ts|tsx)?
  transformIgnorePatterns: [
    'node_modules/(?!(@babel/runtime|ts-jest|@testing-library|other-es-module-package))',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

: ['ts-jest', {
      useESM: true
    }],
    '^.+\.(js|jsx)
  transformIgnorePatterns: [
    'node_modules/(?!(@babel/runtime|ts-jest|@testing-library|other-es-module-package))',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

: 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@babel/runtime|ts-jest|@testing-library|other-es-module-package))',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

