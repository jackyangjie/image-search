import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PermissionService } from '@/services/permission';
import { Colors, Spacing, BorderRadius, FontSize } from '@/constants';

interface PermissionGuideScreenProps {
  onPermissionGranted: () => void;
}

export const PermissionGuideScreen: React.FC<PermissionGuideScreenProps> = ({
  onPermissionGranted,
}) => {
  const handleRequestPermission = async () => {
    const hasPermission = await PermissionService.getInstance().requestPhotoPermission();
    if (hasPermission) {
      onPermissionGranted();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📸</Text>
        </View>

        <Text style={styles.title}>访问您的照片</Text>

        <Text style={styles.description}>
          SmartPhoto Search 需要访问您的照片库，才能为您建立智能索引并提供自然语言搜索功能。
        </Text>

        <View style={styles.bulletPoints}>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletIcon}>🔍</Text>
            <Text style={styles.bulletText}>
              通过自然语言描述快速找到照片
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Text style={styles.bulletIcon}>🏠</Text>
            <Text style={styles.bulletText}>
              所有处理在本地完成，不上传云端
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Text style={styles.bulletIcon}>🔒</Text>
            <Text style={styles.bulletText}>
              您的照片数据完全保存在设备上
            </Text>
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            我们不会上传您的照片到任何服务器。所有AI处理都在您的设备上完成。
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRequestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>允许访问照片</Text>
        </TouchableOpacity>

        <Text style={styles.platformNote}>
          {Platform.OS === 'ios'
            ? '您可以在"设置 > 隐私与安全性 > 照片"中随时更改权限'
            : '您可以在"设置 > 应用 > SmartPhoto Search > 权限"中随时更改权限'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  bulletPoints: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bulletIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  bulletText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  privacyNote: {
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  privacyText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  buttonText: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  platformNote: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
