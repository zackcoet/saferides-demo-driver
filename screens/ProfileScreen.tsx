import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome, Entypo, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Picker } from '@react-native-picker/picker';

const PRIMARY_BLUE = '#174EA6';
const RED = '#D32F2F';
const GRAY = '#888';
const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
const GENDERS = ['Male', 'Female', 'Prefer not to say'];

interface DriverData {
    fullName: string;
    email: string;
    gender: string;
    vehicle: {
        make: string;
        model: string;
        year: string;
        plate: string;
        color: string;
    };
}

const Accordion = ({ title, icon, expanded, onPress, children }: any) => (
  <View style={styles.accordionContainer}>
    <TouchableOpacity style={styles.accordionHeader} onPress={onPress}>
      <View style={styles.accordionHeaderLeft}>
        {icon}
        <Text style={styles.accordionTitle}>{title}</Text>
      </View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={22} color={PRIMARY_BLUE} />
    </TouchableOpacity>
    {expanded && <View style={styles.accordionContent}>{children}</View>}
  </View>
);

const TERMS_TEXT = `Welcome to SafeRides. By accessing or using the SafeRides app ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree, please do not use the Service.

1. Eligibility
You must be a verified student to use SafeRides. By using the Service, you confirm that all information you provide is accurate and truthful.

2. Use of the Service
SafeRides connects riders and drivers within the student community.
You are solely responsible for your interactions, conduct, and safety.
You agree not to misuse the platform or violate any local laws or school policies.

3. User Responsibility
Riders and drivers are independently responsible for their own actions and behavior.
Users must exercise their own judgment when accepting or providing rides.
SafeRides does not screen or guarantee the actions of users beyond student verification.

4. Limitation of Liability
SafeRides is not liable for any direct, indirect, incidental, special, or consequential damages arising out of or related to your use of the Service, including but not limited to personal injury, property damage, or financial loss.
We do not guarantee the availability, quality, or safety of any ride or user.

5. No Warranty
The Service is provided "as is" and "as available." We make no warranties, express or implied, regarding the reliability, safety, or performance of the platform.

6. Termination
We reserve the right to suspend or terminate your access to SafeRides at any time for any reason, including violation of these Terms.

7. Changes to Terms
We may update these Terms at any time. Continued use of the Service after changes means you accept the revised Terms.

8. Contact
For questions or concerns, email us at saferideshelp@gmail.com.`;

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('Freshman');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [gender, setGender] = useState('Male');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  // Dropdowns
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [problemOpen, setProblemOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [trustedOpen, setTrustedOpen] = useState(false);

  // Toggles
  const [locationAccess, setLocationAccess] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  // Feedback
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const driverDoc = await getDoc(doc(db, 'drivers', user.uid));
        if (driverDoc.exists()) {
          const data = driverDoc.data() as DriverData;
          
          // Split full name into first and last name
          const nameParts = data.fullName.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          
          setEmail(data.email);
          setGender(data.gender);
          setVehicleMake(data.vehicle.make);
          setVehicleModel(data.vehicle.model);
          setVehicleYear(data.vehicle.year);
          setLicensePlate(data.vehicle.plate);
          setVehicleColor(data.vehicle.color);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      if (!fullName) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }

      const driverRef = doc(db, 'drivers', user.uid);
      await updateDoc(driverRef, {
        fullName,
        gender,
        vehicle: {
          make: vehicleMake,
          model: vehicleModel,
          year: vehicleYear,
          plate: licensePlate,
          color: vehicleColor
        }
      });

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Placeholder functions
  const handleSubmitFeedback = () => {};
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  const handleUploadPhoto = () => {};

  const fullName = `${firstName || 'John'} ${lastName || 'Doe'}`;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SafeRides</Text>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar and Name */}
        <View style={styles.profileSectionSimple}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleUploadPhoto}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={GRAY} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{`Hi ${fullName}`}</Text>
        </View>

        {/* Accordions */}
        <Accordion
          title="Edit Profile"
          icon={<Ionicons name="person" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={editOpen}
          onPress={() => setEditOpen((v) => !v)}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="First Name*"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor={GRAY}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name*"
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor={GRAY}
            />
          </View>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            placeholder="School Email*"
            value={email}
            editable={false}
            placeholderTextColor={GRAY}
          />
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'Male' && styles.genderButtonSelected
              ]}
              onPress={() => setGender('Male')}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'Male' && styles.genderButtonTextSelected
              ]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'Female' && styles.genderButtonSelected
              ]}
              onPress={() => setGender('Female')}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'Female' && styles.genderButtonTextSelected
              ]}>Female</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={GRAY}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Birthday (MM/DD/YYYY)"
            value={birthday}
            onChangeText={setBirthday}
            placeholderTextColor={GRAY}
          />
          <View style={styles.yearRow}>
            {YEARS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.yearBtn, year === y && styles.yearBtnSelected]}
                onPress={() => setYear(y)}
              >
                <Text style={[styles.yearBtnText, year === y && styles.yearBtnTextSelected]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Major"
            value={major}
            onChangeText={setMajor}
            placeholderTextColor={GRAY}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Make*"
            value={vehicleMake}
            onChangeText={setVehicleMake}
            placeholderTextColor={GRAY}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Model*"
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholderTextColor={GRAY}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Year*"
            value={vehicleYear}
            onChangeText={setVehicleYear}
            keyboardType="numeric"
            placeholderTextColor={GRAY}
          />
          <TextInput
            style={styles.input}
            placeholder="License Plate*"
            value={licensePlate}
            onChangeText={(text) => setLicensePlate(text.toUpperCase())}
            placeholderTextColor={GRAY}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Color*"
            value={vehicleColor}
            onChangeText={setVehicleColor}
            placeholderTextColor={GRAY}
          />
          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </Accordion>

        <Accordion
          title="Add Payment Method"
          icon={<FontAwesome name="credit-card" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={paymentOpen}
          onPress={() => setPaymentOpen((v) => !v)}
        >
          <Text style={styles.infoText}>Add your payment method here. (Coming soon)</Text>
        </Accordion>

        <Accordion
          title="Info"
          icon={<Ionicons name="information-circle" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={infoOpen}
          onPress={() => setInfoOpen((v) => !v)}
        >
          <Text style={styles.infoText}>SafeRides provides 24/7 safe transportation for students on and around the USC campus. Enjoy campus coverage, real-time tracking, secure payment, and in-app chat support.</Text>
          <View style={styles.infoFeatures}>
            <View style={styles.infoFeature}><Ionicons name="car" size={20} color={PRIMARY_BLUE} /><Text style={styles.infoFeatureText}>24/7 Safe Transportation</Text></View>
            <View style={styles.infoFeature}><MaterialIcons name="location-city" size={20} color={PRIMARY_BLUE} /><Text style={styles.infoFeatureText}>Campus Coverage</Text></View>
            <View style={styles.infoFeature}><Ionicons name="locate" size={20} color={PRIMARY_BLUE} /><Text style={styles.infoFeatureText}>Real-time Tracking</Text></View>
            <View style={styles.infoFeature}><FontAwesome name="credit-card" size={18} color={PRIMARY_BLUE} /><Text style={styles.infoFeatureText}>Secure Payment Options</Text></View>
            <View style={styles.infoFeature}><Entypo name="chat" size={20} color={PRIMARY_BLUE} /><Text style={styles.infoFeatureText}>In-app Chat Support</Text></View>
          </View>
          <Text style={styles.infoSubheading}>Service Hours:</Text>
          <Text style={styles.infoText}>{`Mon–Thurs: 8PM–3AM\nFri–Sat: 8PM–4AM\nSun: 8PM–2AM`}</Text>
          <Text style={styles.infoSubheading}>Coverage Area:</Text>
          <Text style={styles.infoText}>USC campus</Text>
        </Accordion>

        <Accordion
          title="Problem"
          icon={<MaterialIcons name="error-outline" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={problemOpen}
          onPress={() => setProblemOpen((v) => !v)}
        >
          <Text style={styles.infoText}>Need help?</Text>
          <TouchableOpacity style={styles.linkBtn}><Text style={styles.linkBtnText}>Check our FAQ →</Text></TouchableOpacity>
          <Text style={styles.infoText}>Call Support: <Text style={styles.boldText}>332 733 6922</Text></Text>
          <Text style={styles.infoText}>Email: <Text style={styles.boldText}>support@saferides.com</Text></Text>
        </Accordion>

        <Accordion
          title="Privacy"
          icon={<FontAwesome name="lock" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={privacyOpen}
          onPress={() => setPrivacyOpen((v) => !v)}
        >
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Location Access</Text>
            <Switch value={locationAccess} onValueChange={setLocationAccess} trackColor={{ true: PRIMARY_BLUE, false: '#ccc' }} />
          </View>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>Analytics</Text>
            <Switch value={analytics} onValueChange={setAnalytics} trackColor={{ true: PRIMARY_BLUE, false: '#ccc' }} />
          </View>
          <Text style={styles.privacyPolicy}>Privacy Policy</Text>
        </Accordion>

        <Accordion
          title="Give feedback for improvement"
          icon={<Entypo name="chat" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={feedbackOpen}
          onPress={() => setFeedbackOpen((v) => !v)}
        >
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Type your feedback here…"
            value={feedback}
            onChangeText={setFeedback}
            placeholderTextColor={GRAY}
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmitFeedback}>
            <Text style={styles.saveBtnText}>Submit Feedback</Text>
          </TouchableOpacity>
        </Accordion>

        <Accordion
          title="Settings"
          icon={<Ionicons name="settings" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={settingsOpen}
          onPress={() => setSettingsOpen((v) => !v)}
        >
          <Text style={styles.infoText}>Settings content (coming soon)</Text>
        </Accordion>

        <Accordion
          title="Terms and Conditions"
          icon={<Ionicons name="document-text-outline" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={termsOpen}
          onPress={() => setTermsOpen((v) => !v)}
        >
          <ScrollView style={{ maxHeight: 300 }}>
            <Text style={styles.infoText}>{TERMS_TEXT}</Text>
          </ScrollView>
        </Accordion>
        <Accordion
          title="Trusted Contact"
          icon={<Ionicons name="person-add-outline" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={trustedOpen}
          onPress={() => setTrustedOpen((v) => !v)}
        >
          <Text style={styles.infoText}>Add a trusted contact for emergencies. (Coming soon)</Text>
        </Accordion>

        {/* Logout */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="logout" size={20} color={RED} style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>Log out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contentContainer: {
    padding: 18,
    paddingBottom: 32,
  },
  profileSectionSimple: {
    alignItems: 'center',
    marginBottom: 18,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
    marginBottom: 8,
  },
  avatarContainer: {
    marginBottom: 0,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  accordionContent: {
    padding: 18,
  },
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    flex: 1,
    marginRight: 8,
    color: '#222',
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  yearBtn: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    marginHorizontal: 3,
    paddingVertical: 10,
    alignItems: 'center',
  },
  yearBtnSelected: {
    backgroundColor: PRIMARY_BLUE,
  },
  yearBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  yearBtnTextSelected: {
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#222',
    marginBottom: 8,
  },
  infoSubheading: {
    fontWeight: 'bold',
    color: PRIMARY_BLUE,
    marginTop: 8,
    marginBottom: 2,
  },
  infoFeatures: {
    marginBottom: 8,
  },
  infoFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoFeatureText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#222',
  },
  linkBtn: {
    marginBottom: 8,
  },
  linkBtnText: {
    color: PRIMARY_BLUE,
    fontWeight: 'bold',
    fontSize: 15,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#222',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  privacyLabel: {
    fontSize: 16,
    color: '#222',
  },
  privacyPolicy: {
    color: PRIMARY_BLUE,
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 15,
  },
  settingsSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  logoutBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
  logoutBtnText: {
    color: RED,
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  pickerContainer: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: PRIMARY_BLUE,
  },
  genderButtonText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#fff',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
});