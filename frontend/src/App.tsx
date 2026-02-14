import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, Typography, TextField, Button, Paper, Box, 
  CircularProgress, Alert, Card, CardContent, Divider, Chip, IconButton, Tooltip,
  ThemeProvider, createTheme, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import MicIcon from '@mui/icons-material/Mic';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import StopIcon from '@mui/icons-material/Stop';
import GoogleIcon from '@mui/icons-material/Google';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, googleProvider, db } from "./firebase";
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend
} from 'recharts';

const theme = createTheme({
  palette: {
    primary: { main: '#21473E', dark: '#0A2E50' },
    secondary: { main: '#6AD2BE' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' },
    text: { primary: '#0A2E50' },
    success: { main: '#6AD2BE' },
    warning: { main: '#FFA726' },
    error: { main: '#D32F2F' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontFamily: '"Inter", sans-serif', fontWeight: 800, color: '#0A2E50', letterSpacing: '-0.02em' },
    h5: { fontFamily: '"Inter", sans-serif', fontWeight: 700, color: '#0A2E50' },
    h6: { fontFamily: '"Inter", sans-serif', fontWeight: 700, color: '#0A2E50' },
    subtitle1: { fontFamily: '"Inter", sans-serif', fontWeight: 600 },
    button: { fontFamily: '"Inter", sans-serif', fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-color: #F0F4F8;
          background-image: url("https://www.transparenttextures.com/patterns/cubes.png"), linear-gradient(135deg, #F0F7F7 0%, #E0E8E8 100%);
          background-attachment: fixed;
        }
        body::before {
          content: "";
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236AD2BE' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6zM36 4V0h-2v4h-4v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          background-size: 120px 120px; z-index: -1;
        }
      `,
    },
  },
});

interface TriageResult {
  risk_level: string;
  confidence_score: number;
  primary_department: string;
  secondary_department: string;
  explanation: string;
  override: boolean;
  override_reasons: string[];
  news2_score: number;
  combined_score: number;
  emergency_action: string | null;
}

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const handleEmailAuth = async (e: any) => {
    e.preventDefault(); setAuthError('');
    try { if (isLogin) { await signInWithEmailAndPassword(auth, email, password); } else { await createUserWithEmailAndPassword(auth, email, password); } } 
    catch (err: any) { setAuthError(err.message); }
  };
  const handleGoogleSignIn = async () => { try { await signInWithPopup(auth, googleProvider); } catch (err: any) { setAuthError(err.message); } };
  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, width: '100%', borderRadius: 3, textAlign: 'center' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '80px', marginBottom: '24px' }} />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>{isLogin ? 'Welcome Back' : 'Create Account'}</Typography>
        {authError && <Alert severity="error" sx={{ mb: 2, fontSize: '0.75rem' }}>{authError}</Alert>}
        <form onSubmit={handleEmailAuth}>
          <TextField fullWidth label="Email" margin="normal" size="small" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField fullWidth label="Password" type="password" margin="normal" size="small" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button fullWidth variant="contained" type="submit" sx={{ mt: 2, py: 1, fontWeight: 'bold' }}>{isLogin ? 'Login' : 'Sign Up'}</Button>
        </form>
        <Divider sx={{ my: 3 }}>OR</Divider>
        <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} onClick={handleGoogleSignIn} sx={{ py: 1, fontWeight: 600 }}>Continue with Google</Button>
        <Button fullWidth sx={{ mt: 2, textTransform: 'none' }} onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}</Button>
      </Paper>
    </Container>
  );
};

const ProfileView = ({ user }: { user: any }) => {
  const [totalTests, setTotalTests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(user.photoURL || '');
  const [credentials, setCredentials] = useState({
    title: 'Senior Triage Clinician',
    dept: 'Emergency Medicine',
    license: 'MD-99203-A'
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, "triage_history"), where("userEmail", "==", user.email));
        const snapshot = await getDocs(q);
        setTotalTests(snapshot.docs.length);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchStats();
  }, [user]);

  const testsLeft = Math.max(0, 10 - totalTests);

  return (
    <Box sx={{ maxWidth: '800px' }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: '#0A2E50' }}>User Profile & Preferences</Typography>
      
      <Grid container spacing={3}>
        {/* User Identity Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E9ECEF', textAlign: 'center' }}>
            <Box sx={{ position: 'relative', width: 100, height: 100, mx: 'auto', mb: 2 }}>
              <Box 
                component="img"
                src={avatarUrl || `https://ui-avatars.com/api/?name=${user.email}&background=6AD2BE&color=21473E&size=128`}
                sx={{ 
                  width: '100%', height: '100%', borderRadius: '50%', 
                  objectFit: 'cover', border: '3px solid #6AD2BE', boxShadow: 2 
                }}
              />
            </Box>
            <Typography variant="h6">{user.displayName || user.email?.split('@')[0]}</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>{user.email}</Typography>
            
            <Button 
              variant="outlined" component="label" size="small" 
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Update Photo
              <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </Button>
          </Paper>
        </Grid>

        {/* Usage Stats Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E9ECEF', height: '100%', bgcolor: '#0A2E50', color: 'white' }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 2 }}>USAGE ANALYTICS</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#6AD2BE' }}>{totalTests}</Typography>
              <Typography variant="body2">Total Assessments Completed</Typography>
            </Box>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 2 }} />
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">Free Trial Balance</Typography>
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{testsLeft} / 10 Left</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ width: `${(testsLeft/10)*100}%`, height: '100%', bgcolor: '#6AD2BE' }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Editable Clinical Credentials */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E9ECEF' }}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: '1.1rem' }}>Clinical Credentials</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Professional Title" value={credentials.title} onChange={(e) => setCredentials({...credentials, title: e.target.value})} size="small" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Primary Department" value={credentials.dept} onChange={(e) => setCredentials({...credentials, dept: e.target.value})} size="small" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Medical License Number" value={credentials.license} onChange={(e) => setCredentials({...credentials, license: e.target.value})} size="small" />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" sx={{ px: 4, fontWeight: 700 }}>Save Changes</Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const AnalyticsView = ({ user }: { user: any }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "triage_history"), where("userEmail", "==", user.email));
        const snapshot = await getDocs(q);
        setData(snapshot.docs.map(doc => doc.data()));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if (loading) return <Box sx={{ p: 10, textAlign: 'center' }}><CircularProgress size={60} thickness={4} /><Typography variant="h6" sx={{ mt: 2 }}>Aggregating Clinical Data...</Typography></Box>;

  // Chart Data Calculations
  const riskCounts = data.reduce((acc: any, curr: any) => {
    const risk = curr.result?.risk_level || 'Low';
    acc[risk] = (acc[risk] || 0) + 1;
    return acc;
  }, { High: 0, Medium: 0, Low: 0 });

  const pieData = [
    { name: 'High Risk', value: riskCounts.High, color: '#D32F2F' },
    { name: 'Medium Risk', value: riskCounts.Medium, color: '#FFA726' },
    { name: 'Low Risk', value: riskCounts.Low, color: '#6AD2BE' }
  ];

  const deptCounts = data.reduce((acc: any, curr: any) => {
    const dept = curr.result?.primary_department || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});
  const barData = Object.keys(deptCounts).map(key => ({ name: key, count: deptCounts[key] })).sort((a,b) => b.count - a.count);

  return (
    <Box sx={{ pb: 8, maxWidth: '1200px' }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, color: '#0A2E50' }}>Knowledge & Insights Center</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 5, fontWeight: 500 }}>
        Operational metrics and clinical education for the CliniFlow Multimodal System.
      </Typography>
      
      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E9ECEF', height: '100%', bgcolor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 700 }}>Clinical Risk Distribution</Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2, textAlign: 'center', fontStyle: 'italic' }}>
              Based on your last {data.length} assessments
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E9ECEF', height: '100%', bgcolor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 700 }}>Departmental Routing Load</Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 11 }} />
                  <ChartTooltip cursor={{ fill: '#F8F9FA' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#21473E" radius={[6, 6, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* EDUCATIONAL MANUAL */}
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 800, color: '#0A2E50', borderLeft: '5px solid #6AD2BE', pl: 2 }}>
        Clinical User Manual
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Accordion defaultExpanded elevation={0} sx={{ borderRadius: '12px !important', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#21473E' }} />} sx={{ bgcolor: '#F8F9FA' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <HealthAndSafetyIcon sx={{ color: '#21473E' }} />
              <Typography sx={{ fontWeight: 700, color: '#0A2E50' }}>1. The NEWS2 Standard (National Early Warning Score)</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 4 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, lineHeight: 1.7, fontSize: '0.95rem' }}>
              NEWS2 is the gold-standard physiological scoring system developed by the Royal College of Physicians (UK). It provides a standardized "universal language" for tracking acute clinical deterioration. 
            </Typography>
            <Grid container spacing={2}>
              {[ 
                { range: '0 - 2', label: 'Low Risk', desc: 'Standard observation. Continue routine monitoring.' },
                { range: '3 - 4', label: 'Medium Risk', desc: 'Clinical alert. Requires senior clinician or specialist review.' },
                { range: '5+', label: 'Urgent Alert', desc: 'Immediate priority. Triggers absolute Red Alert and Emergency routing.', red: true }
              ].map((tier, i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: tier.red ? '#FFF5F5' : '#F0F7F7', border: `1px solid ${tier.red ? '#FED7D7' : '#E0E8E8'}`, height: '100%' }}>
                    <Typography variant="h6" sx={{ color: tier.red ? '#D32F2F' : '#21473E', fontWeight: 800 }}>{tier.range}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{tier.label}</Typography>
                    <Typography variant="caption" color="textSecondary">{tier.desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion elevation={0} sx={{ borderRadius: '12px !important', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#21473E' }} />} sx={{ bgcolor: '#F8F9FA' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AnalyticsIcon sx={{ color: '#21473E' }} />
              <Typography sx={{ fontWeight: 700, color: '#0A2E50' }}>2. The Integrated Clinical Index (The CliniFlow Score)</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 4 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, lineHeight: 1.7, fontSize: '0.95rem' }}>
              While NEWS2 only measures vital signs, the <b>Integrated Index</b> captures the "Full Patient Story." It is a unique CliniFlow metric that combines objective data with semantic and historical risk factors.
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: '#FFFDE7', border: '1px solid #FFF176', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#F9A825', fontWeight: 800, mb: 1 }}>INDEX = NEWS2 + SYMPTOMS + HISTORY</Typography>
              <Typography variant="body2" color="#827717" sx={{ fontWeight: 500 }}>
                A high Index with a low NEWS2 indicates a "Walking Emergency"—a patient with stable vitals but a dangerous medical narrative (e.g., active stroke).
              </Typography>
            </Paper>
          </AccordionDetails>
        </Accordion>

        <Accordion elevation={0} sx={{ borderRadius: '12px !important', border: '1px solid #E9ECEF', overflow: 'hidden' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#21473E' }} />} sx={{ bgcolor: '#F8F9FA' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ color: '#21473E' }} />
              <Typography sx={{ fontWeight: 700, color: '#0A2E50' }}>3. How the Multi-Stage AI Processes Data</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 4 }}>
            <Grid container spacing={4}>
              {[
                { title: 'The Scribe (LLM)', desc: 'Gemini 3 Pro Preview transcribes voice and parses PDFs to extract vitals and calculate semantic severity.' },
                { title: 'The Engine (ML)', desc: 'A Random Forest Classifier trained on 5,000 cases calculates statistical probability based on multi-factor correlations.' },
                { title: 'The Referee (Peer Review)', desc: 'A final LLM safety check ensures that subtle clinical signals (like facial drooping) aren\'t lost in the numbers.' }
              ].map((step, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#21473E', mb: 1 }}>{i+1}. {step.title}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>{step.desc}</Typography>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

const PatientHistoryView = ({ user }: { user: any }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, "triage_history"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setHistory(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchHistory();
  }, [user]);
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  return (
    <Box sx={{ maxWidth: '900px' }}>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 700, color: '#0A2E50' }}>Patient Triage History</Typography>
      {history.length === 0 ? <Paper sx={{ p: 6, textAlign: 'center' }}><Typography>No records found.</Typography></Paper> : 
        history.map((record) => {
          const date = record.timestamp?.toDate ? record.timestamp.toDate() : new Date();
          const risk = record.result?.risk_level || 'Low';
          const riskColor = risk === 'High' ? '#D32F2F' : (risk === 'Medium' ? '#FFA726' : '#6AD2BE');
          const isSelected = selectedId === record.id;
          return (
            <Box key={record.id} sx={{ mb: 2 }}>
              <Card elevation={isSelected ? 4 : 1} sx={{ borderRadius: 2, borderLeft: `6px solid ${riskColor}`, cursor: 'pointer' }} onClick={() => setSelectedId(isSelected ? null : record.id)}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>ID: {record.patientData?.patient_id || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">{date.toLocaleDateString()} at {date.toLocaleTimeString()}</Typography>
                  </Box>
                  <Chip label={risk.toUpperCase()} size="small" sx={{ bgcolor: riskColor, color: 'white', fontWeight: 700 }} />
                </CardContent>
              </Card>
              {isSelected && (
                <Paper variant="outlined" sx={{ mt: 1, p: 3, borderRadius: 2, bgcolor: 'white' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={6}><Typography variant="overline">NEWS2 Score</Typography><Typography variant="h6">{record.result?.news2_score ?? 'N/A'}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="overline">Clinical Index</Typography><Typography variant="h6">{record.result?.combined_score ?? 'N/A'}</Typography></Grid>
                    <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Clinical Reasoning</Typography><ReactMarkdown>{record.result?.explanation || ''}</ReactMarkdown></Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          );
        })
      }
    </Box>
  );
};

function App() {
  const [user, loadingAuth] = useAuthState(auth);
  const [currentView, setCurrentView] = useState('triage');
  const [formData, setFormData] = useState({ patient_id: '', age: '' as any, gender: '', symptoms: '', heart_rate: '' as any, temp: '' as any, systolic_bp: '' as any, diastolic_bp: '' as any, pre_existing: '' });
  const [loading, setLoading] = useState(false);
  const [processingType, setProcessingType] = useState<'doc' | 'voice' | null>(null);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zipcode, setZipcode] = useState('');
  const [hospitals, setHospitals] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [transmissionReceipt, setTransmissionReceipt] = useState<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any>([]);

  const navItems = [
    { id: 'triage', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'history', label: 'History', icon: <HistoryIcon /> },
    { id: 'analytics', label: 'Insights', icon: <AnalyticsIcon /> },
    { id: 'profile', label: 'Profile', icon: <PersonIcon /> },
  ];

  const handleChange = (e: any) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const sanitize = (d: any) => ({
    patient_id: String(d.patient_id || ""), age: d.age === '' ? null : Number(d.age), gender: String(d.gender || ""), symptoms: String(d.symptoms || ""),
    heart_rate: d.heart_rate === '' ? null : Number(d.heart_rate), temp: d.temp === '' ? null : Number(d.temp),
    systolic_bp: d.systolic_bp === '' ? null : Number(d.systolic_bp), diastolic_bp: d.diastolic_bp === '' ? null : Number(d.diastolic_bp),
    pre_existing: String(d.pre_existing || "")
  });

  const handleDocumentUpload = async (e: any) => {
    if (!e.target.files?.[0]) return;
    setProcessingType('doc'); setError(null);
    const uploadData = new FormData(); uploadData.append('file', e.target.files[0]);
    try { const response = await axios.post('http://localhost:8000/extract-from-document', uploadData); setFormData(prev => ({ ...prev, ...response.data })); } 
    catch (err) { setError('Extraction failed.'); } finally { setProcessingType(null); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream); audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e: any) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const voiceData = new FormData(); voiceData.append('file', new Blob(audioChunksRef.current), 'v.webm');
        setProcessingType('voice');
        try { const response = await axios.post('http://localhost:8000/process-voice', voiceData); setFormData(prev => ({ ...prev, ...response.data })); } 
        catch (err) { setError('Voice processing failed.'); } finally { setProcessingType(null); }
      };
      mediaRecorderRef.current.start(); setRecording(true);
    } catch (err) { setError('Mic error.'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null); setResult(null);
    try {
      const sanitized = sanitize(formData);
      const response = await axios.post('http://localhost:8000/triage', sanitized);
      setResult(response.data);
      if (user) { await addDoc(collection(db, "triage_history"), { userId: user.uid, userEmail: user.email, timestamp: Timestamp.now(), patientData: formData, result: response.data }); }
    } catch (err: any) { setError('Analysis failed.'); } finally { setLoading(false); }
  };

  const handleSearchHospitals = async () => {
    if (!zipcode) return; setSearching(true);
    try { const response = await axios.post('http://localhost:8000/search-hospitals', null, { params: { zipcode } }); setHospitals(response.data.hospitals); } 
    catch (err) { setError('Search failed.'); } finally { setSearching(false); }
  };

  const handleNotifyHospital = async () => {
    if (!permissionGranted) return; setTransmitting(true);
    try {
      const hName = hospitals?.split('\n')[0].replace(/[*#-]/g, '').trim() || "Nearby Medical Center";
      const response = await axios.post('http://localhost:8000/send-intake', sanitize(formData), { params: { hospital_name: hName } });
      setTransmissionReceipt({ id: response.data.transmission_id, msg: response.data.message });
    } catch (err) { setError('Notify failed.'); } finally { setTransmitting(false); }
  };

  const getRiskColor = (l: string) => { switch (l) { case 'High': return 'error'; case 'Medium': return 'warning'; case 'Low': return 'success'; default: return 'primary'; } };

  if (loadingAuth) return <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>;
  if (!user) return <ThemeProvider theme={theme}><AuthPage /></ThemeProvider>;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Drawer variant="permanent" sx={{ width: 260, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: 260, boxSizing: 'border-box', bgcolor: '#0A2E50', color: 'white', borderRight: 'none' } }}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <img src="/icon.png" alt="Icon" style={{ height: '60px', width: '60px', objectFit: 'contain' }} onError={(e) => { (e.target as any).style.display = 'none'; }} />
            <Typography variant="h6" sx={{ color: 'white', mt: 1, fontWeight: 700 }}>CliniFlow</Typography>
          </Box>
          <List sx={{ px: 1 }}>
            {navItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton selected={currentView === item.id} onClick={() => setCurrentView(item.id)} sx={{ borderRadius: 2, '&.Mui-selected': { bgcolor: 'rgba(106, 210, 190, 0.2)', color: '#6AD2BE' }, '&.Mui-selected .MuiListItemIcon-root': { color: '#6AD2BE' } }}>
                  <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 'auto', p: 2, mb: 2 }}>
            <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', color: 'white', mb: 2, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Logged in as:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</Typography>
            </Paper>
            <Button fullWidth variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={() => signOut(auth)} sx={{ borderColor: 'rgba(255,255,255,0.3)', textTransform: 'none' }}>Logout</Button>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 4, width: 'calc(100% - 260px)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, p: 3, borderRadius: 2, bgcolor: 'white', boxShadow: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pr: 4, borderRight: '2px solid #E9ECEF' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '80px', marginBottom: '8px' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6AD2BE', letterSpacing: '0.1em', ml: 3 }}>SMARTER TRIAGE. FASTER CARE.</Typography>
              </Box>
              <Box sx={{ pl: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: '1.8rem', background: 'linear-gradient(45deg, #0A2E50 30%, #21473E 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: '"Inter", sans-serif', letterSpacing: '-0.02em' }}>
                  Hi {user?.displayName || user?.email?.split('@')[0] || 'User'}, Welcome!
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>Ready for your next clinical assessment?</Typography>
              </Box>
            </Box>
          </Box>

          {currentView === 'triage' ? (
            <Grid container spacing={3}>
              {/* ... existing code ... */}
              <Grid item xs={12} md={5}>
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #E9ECEF', borderTop: '4px solid #21473E' }}>
                  <Typography variant="h6" gutterBottom>Patient Intake</Typography>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', bgcolor: '#F5F5F5', p: 1, borderRadius: 2 }}>
                          <Button variant="contained" component="label" size="small" startIcon={processingType === 'doc' ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />} disabled={processingType !== null} sx={{ textTransform: 'none' }}>
                            Upload Document<input type="file" hidden onChange={handleDocumentUpload} accept=".pdf,.png,.jpg,.jpeg,.txt" />
                          </Button>
                          <IconButton color={recording ? "error" : "primary"} onClick={recording ? () => mediaRecorderRef.current?.stop() : startRecording} disabled={processingType !== null && processingType !== 'voice'}>
                            {processingType === 'voice' ? <CircularProgress size={24} /> : (recording ? <StopIcon /> : <MicIcon />)}
                          </IconButton>
                          {processingType && <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>{processingType === 'doc' ? 'Parsing...' : 'Transcribing...'}</Typography>}
                        </Box>
                      </Grid>
                      <Grid item xs={12}><TextField fullWidth size="small" label="Patient ID" name="patient_id" value={formData.patient_id} onChange={handleChange} required /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" label="Gender" name="gender" select SelectProps={{ native: true }} value={formData.gender} onChange={handleChange} required><option value=""></option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></TextField></Grid>
                      <Grid item xs={12}><TextField fullWidth size="small" label="Medical History" name="pre_existing" value={formData.pre_existing} onChange={handleChange} placeholder="e.g. Diabetes, Asthma" /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" label="Heart Rate (bpm)" name="heart_rate" type="number" value={formData.heart_rate} onChange={handleChange} required /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" label="Temp (°C)" name="temp" type="number" inputProps={{ step: 0.1 }} value={formData.temp} onChange={handleChange} required /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" label="Systolic BP" name="systolic_bp" type="number" value={formData.systolic_bp} onChange={handleChange} required /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" label="Current Symptoms" name="symptoms" multiline rows={1} value={formData.symptoms} onChange={handleChange} required placeholder="Complaints..." /></Grid>
                      <Grid item xs={6}><TextField fullWidth size="small" label="Diastolic BP" name="diastolic_bp" type="number" value={formData.diastolic_bp} onChange={handleChange} required /></Grid>
                      <Grid item xs={12}><Button fullWidth variant="contained" type="submit" size="large" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MedicalInformationIcon />}>{loading ? 'Analyzing...' : 'Analyze & Triage'}</Button></Grid>
                    </Grid>
                  </form>
                </Paper>
              </Grid>

              <Grid item xs={12} md={7}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {!result && !loading && !error && <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, bgcolor: 'white', borderRadius: 2, border: '2px dashed #6AD2BE', opacity: 0.8 }}><img src="/icon.png" alt="Icon" style={{ height: '80px', opacity: 0.5, marginBottom: '16px' }} /><Typography>Patient assessment data will appear here.</Typography></Box>}
                {loading && <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10 }}><CircularProgress size={60} /><Typography variant="h6" sx={{ mt: 2 }}>Synthesizing Insights...</Typography></Box>}
                {result && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {result.emergency_action && <Alert severity="error" variant="filled" sx={{ borderRadius: 3, fontWeight: 'bold', animation: 'pulse 2s infinite' }}>{result.emergency_action}</Alert>}
                    <Card elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ bgcolor: (theme.palette as any)[getRiskColor(result.risk_level || 'Low')]?.main || '#21473E', height: 8 }} />
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                          <Box><Typography variant="h5">Risk Assessment</Typography><Typography variant="body2" color="textSecondary">Multi-Stage Clinical Consensus</Typography></Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={`NEWS2: ${result.news2_score ?? 'N/A'}`} variant="outlined" color={(Number(result.news2_score) >= 5) ? "error" : "default"} sx={{ fontWeight: 'bold' }} />
                            <Chip label={`Index: ${result.combined_score ?? 'N/A'}`} variant="filled" sx={{ bgcolor: '#FBC02D', color: '#21473E', fontWeight: 'bold' }} />
                            <Chip label={String(result.risk_level || 'Low').toUpperCase() + ' RISK'} color={getRiskColor(result.risk_level || 'Low') as any} sx={{ fontWeight: 'bold', px: 2 }} />
                          </Box>
                        </Box>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                          <Grid item xs={6}><Typography variant="overline" color="textSecondary">Primary Recommendation</Typography><Typography variant="h6">{result.primary_department || 'N/A'}</Typography></Grid>
                          <Grid item xs={6}><Typography variant="overline" color="textSecondary">Model Confidence</Typography><Typography variant="h6">{((Number(result.confidence_score) || 0) * 100).toFixed(1)}%</Typography></Grid>
                          <Grid item xs={12}><Typography variant="overline" color="textSecondary">Secondary Recommendation</Typography><Typography variant="body1" sx={{ fontWeight: 500 }}>{result.secondary_department || 'N/A'}</Typography></Grid>
                        </Grid>
                        <Box sx={{ p: 3, bgcolor: '#F8F9FA', borderRadius: 1, border: '1px solid #E9ECEF', mb: 3 }}><Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0A2E50' }}>Clinical Reasoning</Typography><Box sx={{ fontSize: '0.95rem', color: '#21473E' }}><ReactMarkdown>{result.explanation || ''}</ReactMarkdown></Box></Box>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="h6" gutterBottom>Find Nearby Medical Facilities</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <TextField size="small" label="Enter Zipcode" value={zipcode} onChange={(e) => setZipcode(e.target.value)} sx={{ flexGrow: 1 }} />
                          <Button variant="outlined" onClick={handleSearchHospitals} disabled={searching || !zipcode} startIcon={searching ? <CircularProgress size={16} /> : <UploadFileIcon />}>Search</Button>
                        </Box>
                        {hospitals && (
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ p: 2, bgcolor: '#F8F9FA', borderRadius: 1, mb: 2, border: '1px solid #E9ECEF' }}><ReactMarkdown>{hospitals}</ReactMarkdown></Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ p: 2, border: '1px solid #6AD2BE', borderRadius: 1, bgcolor: '#FFFFFF' }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#0A2E50' }}>Hospital Pre-Intake Notification</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><Typography variant="body2" sx={{ mr: 1 }}>Grant Permission</Typography><input type="checkbox" checked={permissionGranted} onChange={(e) => setPermissionGranted(e.target.checked)} /></Box>
                              <Tooltip title={!permissionGranted ? "Grant permission to notify" : ""}><span style={{ width: '100%' }}><Button variant="contained" color="primary" fullWidth disabled={!permissionGranted || transmitting || !!transmissionReceipt} onClick={handleNotifyHospital} startIcon={transmitting ? <CircularProgress size={16} color="inherit" /> : <HealthAndSafetyIcon />}>{transmissionReceipt ? "Data Transmitted" : "Transmit Data to Hospital"}</Button></span></Tooltip>
                              {transmissionReceipt && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}><Typography variant="caption" sx={{ fontWeight: 'bold' }}>Ref: {transmissionReceipt.id}</Typography><Typography variant="body2" display="block">{transmissionReceipt.msg}</Typography></Alert>}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </Grid>
            </Grid>
          ) : currentView === 'history' ? (
            <PatientHistoryView user={user} />
          ) : currentView === 'analytics' ? (
            <AnalyticsView user={user} />
          ) : currentView === 'profile' ? (
            <ProfileView user={user} />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'white', borderRadius: 3 }}><Typography variant="h6">Module Coming Soon</Typography></Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
export default App;