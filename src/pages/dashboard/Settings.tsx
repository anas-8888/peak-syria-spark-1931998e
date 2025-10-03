import { Save, Shield, Bell, Globe, Palette, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات المتجر والحساب</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>معلومات الحساب</CardTitle>
              <CardDescription>تحديث معلومات الملف الشخصي الخاص بك</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" placeholder="أدخل اسمك الكامل" defaultValue="مدير النظام" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                defaultValue="admin@peaksyria.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" placeholder="+963 123 456 789" defaultValue="+963 123 456 789" />
          </div>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            حفظ التغييرات
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-500/10 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle>الأمان</CardTitle>
              <CardDescription>إدارة كلمة المرور والأمان</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current">كلمة المرور الحالية</Label>
            <Input id="current" type="password" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new">كلمة المرور الجديدة</Label>
              <Input id="new" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
              <Input id="confirm" type="password" placeholder="••••••••" />
            </div>
          </div>
          <Button variant="destructive" className="gap-2">
            <Shield className="h-4 w-4" />
            تحديث كلمة المرور
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>الإشعارات</CardTitle>
              <CardDescription>إدارة تفضيلات الإشعارات</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">إشعارات الطلبات الجديدة</p>
              <p className="text-sm text-muted-foreground">تلقي إشعار عند وصول طلب جديد</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">إشعارات المخزون المنخفض</p>
              <p className="text-sm text-muted-foreground">تنبيه عند انخفاض مخزون المنتجات</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">إشعارات المدفوعات</p>
              <p className="text-sm text-muted-foreground">تلقي تحديثات حول المعاملات المالية</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">النشرة الإخبارية</p>
              <p className="text-sm text-muted-foreground">تلقي آخر الأخبار والتحديثات</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <Globe className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>إعدادات المتجر</CardTitle>
              <CardDescription>إدارة معلومات المتجر</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">اسم المتجر</Label>
            <Input id="storeName" defaultValue="PEAK Syria" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storeEmail">البريد الإلكتروني للمتجر</Label>
            <Input id="storeEmail" type="email" defaultValue="info@peaksyria.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storePhone">هاتف المتجر</Label>
            <Input id="storePhone" defaultValue="+963 11 123 4567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input id="address" defaultValue="دمشق، سوريا" />
          </div>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Palette className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>المظهر</CardTitle>
              <CardDescription>تخصيص مظهر لوحة التحكم</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">الوضع الليلي</p>
              <p className="text-sm text-muted-foreground">تفعيل الوضع الداكن للواجهة</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">اللغة</p>
              <p className="text-sm text-muted-foreground">العربية</p>
            </div>
            <Button variant="outline" size="sm">
              تغيير
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
