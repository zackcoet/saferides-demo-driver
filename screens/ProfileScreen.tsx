import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome, Entypo, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
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
    phone: string;
    birthday: string;
    year: string;
    major: string;
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
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);

  // Toggles
  const [locationAccess, setLocationAccess] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  // Feedback
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, currentUser => {
      if (!currentUser) return;

      const fetchUserData = async () => {
        try {
          const driverDoc = await getDoc(doc(db, 'drivers', currentUser.uid));
          if (driverDoc.exists()) {
            const data = driverDoc.data() as DriverData;
            
            // Split full name into first and last name
            const nameParts = data.fullName.split(' ');
            setFirstName(nameParts[0] || '');
            setLastName(nameParts.slice(1).join(' ') || '');
            
            setEmail(data.email);
            setGender(data.gender);
            setPhone(data.phone || '');
            setBirthday(data.birthday || '');
            setYear(data.year || 'Freshman');
            setMajor(data.major || '');
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
    });

    return () => unsub();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to save changes');
        setIsSaving(false);
        return;
      }

      try {
        const fullName = `${firstName} ${lastName}`.trim();
        if (!fullName) {
          Alert.alert('Error', 'Please enter your full name');
          setIsSaving(false);
          return;
        }

        const driverRef = doc(db, 'drivers', currentUser.uid);
        await updateDoc(driverRef, {
          fullName,
          gender,
          phone,
          birthday,
          year,
          major,
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
    });

    return () => unsub();
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
      return;
    }

    setIsSubmittingFeedback(true);

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to submit feedback');
        setIsSubmittingFeedback(false);
        return;
      }

      try {
        await addDoc(collection(db, 'feedback'), {
          userId: currentUser.uid,
          email: currentUser.email,
          message: feedback.trim(),
          timestamp: serverTimestamp()
        });

        Alert.alert('Success', 'Thanks for your feedback!');
        setFeedback(''); // Clear the input
      } catch (error) {
        console.error('Error submitting feedback:', error);
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      } finally {
        setIsSubmittingFeedback(false);
      }
    });

    return () => unsub();
  };

  // Placeholder functions
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
                gender === 'Male' && styles.genderButtonSelected,
                styles.genderButtonDisabled
              ]}
              disabled={true}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'Male' && styles.genderButtonTextSelected
              ]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'Female' && styles.genderButtonSelected,
                styles.genderButtonDisabled
              ]}
              disabled={true}
            >
              <Text style={[
                styles.genderButtonText,
                gender === 'Female' && styles.genderButtonTextSelected
              ]}>Female</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.disabledNote}>Gender cannot be changed after account creation</Text>
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
          <TouchableOpacity style={styles.bankButton}>
            <Ionicons name="card-outline" size={24} color="#174EA6" />
            <Text style={styles.bankButtonText}>Connect Bank Account</Text>
          </TouchableOpacity>
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
          title="Privacy Policy"
          icon={<FontAwesome name="shield" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={privacyPolicyOpen}
          onPress={() => setPrivacyPolicyOpen((v) => !v)}
        >
          <ScrollView style={styles.policyScrollView}>
            <Text style={styles.policyTitle}>SafeRides™ Driver Privacy Policy</Text>
            <Text style={styles.policyDate}>Last updated: 7 June 2025</Text>
            
            <Text style={styles.policyText}>
              At SafeRides™, your privacy matters. This Privacy Policy outlines how we collect, use, store, and protect your personal information as a driver using the SafeRides™ platform.
            </Text>

            <Text style={styles.policyHeading}>1. Information We Collect</Text>
            <Text style={styles.policyText}>
              When you sign up and operate as a driver on SafeRides™, we may collect:
            </Text>
            <Text style={styles.policyText}>
              Personal Information: Name, phone number, email address, university name, profile photo, and gender.{'\n\n'}
              Vehicle Information: Make, model, color, license plate, and insurance details.{'\n\n'}
              Identification Documents: Driver's license, student ID, and any other documents needed to verify eligibility.{'\n\n'}
              Location Data: Real-time GPS location while online or completing rides.{'\n\n'}
              Ride Data: Trip history, earnings, completed rides, ratings, and feedback.{'\n\n'}
              Device Data: Device type, OS, crash logs, and app usage data.
            </Text>

            <Text style={styles.policyHeading}>2. How We Use Your Information</Text>
            <Text style={styles.policyText}>
              We use your data to:{'\n'}
              • Verify your eligibility to drive on the platform.{'\n'}
              • Match you with nearby ride requests based on your selected preferences.{'\n'}
              • Provide customer support and communicate important updates.{'\n'}
              • Monitor and improve driver safety and app functionality.{'\n'}
              • Comply with legal obligations and enforce platform rules.
            </Text>

            <Text style={styles.policyHeading}>3. Location Tracking</Text>
            <Text style={styles.policyText}>
              Location services must be enabled to use SafeRides™ as a driver. Your live location is only visible to matched riders during an active trip and is used for safety, routing, and support purposes.
            </Text>

            <Text style={styles.policyHeading}>4. Information Sharing</Text>
            <Text style={styles.policyText}>
              We do not sell your personal information.{'\n\n'}
              However, we may share your data with:{'\n'}
              • Riders: Name, profile photo, vehicle info, and rating are visible to matched riders.{'\n'}
              • Service Providers: Only those supporting payment processing, verification, or background checks.{'\n'}
              • Law Enforcement: If legally required or in emergencies.
            </Text>

            <Text style={styles.policyHeading}>5. Data Security</Text>
            <Text style={styles.policyText}>
              We use encryption, secure storage, and access controls to protect your data. Despite this, no system is 100% secure, and we encourage you to protect your account credentials.
            </Text>

            <Text style={styles.policyHeading}>6. Your Choices</Text>
            <Text style={styles.policyText}>
              You can access and update your profile information at any time. You may delete your account by contacting us at saferideshelp@gmail.com — note that certain records (e.g. ride history or payment data) may be retained as required by law.
            </Text>

            <Text style={styles.policyHeading}>7. Changes to This Policy</Text>
            <Text style={styles.policyText}>
              We may update this policy from time to time. We'll notify you via email or in-app notice if changes are significant.
            </Text>

            <Text style={styles.policyHeading}>Questions?</Text>
            <Text style={styles.policyText}>
              If you have any questions about this policy or how your data is handled, contact us at:{'\n'}
              saferideshelp@gmail.com
            </Text>
          </ScrollView>
        </Accordion>

        <Accordion
          title="Give feedback for improvement"
          icon={<Entypo name="chat" size={22} color={PRIMARY_BLUE} style={{ marginRight: 12 }} />}
          expanded={feedbackOpen}
          onPress={() => setFeedbackOpen((v) => !v)}
        >
          <TextInput
            style={[styles.input, styles.feedbackInput]}
            placeholder="Type your feedback here…"
            value={feedback}
            onChangeText={setFeedback}
            placeholderTextColor={GRAY}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity 
            style={[styles.saveBtn, isSubmittingFeedback && styles.saveBtnDisabled]} 
            onPress={handleSubmitFeedback}
            disabled={isSubmittingFeedback}
          >
            {isSubmittingFeedback ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Submit Feedback</Text>
            )}
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
  genderButtonDisabled: {
    opacity: 0.8,
  },
  disabledNote: {
    fontSize: 12,
    color: GRAY,
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 12,
    textAlign: 'center',
  },
  feedbackInput: {
    minHeight: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  policyScrollView: {
    maxHeight: 400,
  },
  policyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  policyDate: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 16,
  },
  policyHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_BLUE,
    marginTop: 16,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  bankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bankButtonText: {
    fontSize: 16,
    color: '#174EA6',
    marginLeft: 12,
    fontWeight: '500',
  },
});