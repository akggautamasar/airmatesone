import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, IndianRupee, Mail, Phone } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Profile = () => {
  const { profile, loading, updateProfile } = useProfile();
  const { setLanguage } = useAuth();
  const { t, language } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    upi_id: '',
    mobile_number: '',
    language: 'en',
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        upi_id: profile.upi_id || '',
        mobile_number: profile.mobile_number || '',
        language: profile.language || language || 'en',
      });
    }
  }, [profile, language]);

  const handleSave = async () => {
    await updateProfile(formData);
    setLanguage(formData.language);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>{t('profile_title')}</span>
          </CardTitle>
          <CardDescription>
            {t('profile_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email_label')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="pl-10 bg-gray-100"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">{t('display_name_label')}</Label>
              <Input
                id="name"
                placeholder={t('display_name_placeholder')}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile">{t('mobile_number_label')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder={t('mobile_number_placeholder')}
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="upiId">{t('upi_id_label')}</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="upiId"
                  placeholder={t('upi_id_placeholder')}
                  value={formData.upi_id}
                  onChange={(e) => setFormData({...formData, upi_id: e.target.value})}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('language_label')}</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
                disabled={!isEditing}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                {t('edit_profile_button')}
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  {t('save_changes_button')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile?.name || '',
                      upi_id: profile?.upi_id || '',
                      mobile_number: profile?.mobile_number || '',
                      language: profile?.language || language || 'en',
                    });
                  }}
                >
                  {t('cancel_button')}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
