"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { Trash2, UserPlus, Search, RefreshCcw } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Paper,
  InputAdornment,
} from '@mui/material';

export default function ManagePatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Patient Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('male');
  const [contactNumber, setContactNumber] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');

  const [deletingPatient, setDeletingPatient] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age) {
      toast.error('Please provide name and age');
      return;
    }

    setCreating(true);
    try {
      await api.post('/patients', {
        name,
        age: Number(age),
        weight: weight ? Number(weight) : undefined,
        gender,
        contactNumber,
        medicalHistory: medicalHistory ? medicalHistory.split(',').map(h => h.trim()) : [],
        allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
      });
      toast.success('Patient created successfully');
      setName('');
      setAge('');
      setWeight('');
      setContactNumber('');
      setMedicalHistory('');
      setAllergies('');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to create patient');
    } finally {
      setCreating(false);
    }
  };

  const confirmDeletePatient = async () => {
    if (!deletingPatient) return;
    try {
      setIsDeleting(true);
      await api.delete(`/patients/${deletingPatient._id}`);
      toast.success('Patient deleted');
      fetchPatients();
      setDeletingPatient(null);
    } catch (error) {
      toast.error('Failed to delete patient');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeletePatient = (patient: any) => {
    setDeletingPatient(patient);
  };

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Toaster />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Manage Patients</Typography>
            <Typography variant="body2" color="text.secondary">View and register new patients</Typography>
          </Box>
          <Button
            onClick={fetchPatients}
            startIcon={<RefreshCcw className="w-4 h-4" />}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 8, textTransform: 'none' }}
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '350px 1fr' }, gap: 4 }}>
          
          {/* Create Patient Form */}
          <Box component={motion.div} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: 1, bgcolor: 'background.paper', position: 'sticky', top: 24 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, fontWeight: 700, color: 'primary.main' }}>
                <UserPlus className="w-5 h-5" /> New Patient
              </Typography>
              
              <form onSubmit={handleCreatePatient}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  
                  <TextField 
                    label="Full Name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    fullWidth 
                    size="small"
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField 
                      label="Age" 
                      type="number" 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      required 
                      sx={{ flex: 1 }} 
                      size="small"
                    />
                    <TextField 
                      label="Weight (kg)" 
                      type="number" 
                      value={weight} 
                      onChange={(e) => setWeight(e.target.value)} 
                      sx={{ flex: 1 }} 
                      size="small"
                    />
                  </Box>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select value={gender} label="Gender" onChange={(e) => setGender(e.target.value)}>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField 
                    label="Contact Number" 
                    type="tel" 
                    value={contactNumber} 
                    onChange={(e) => setContactNumber(e.target.value)} 
                    fullWidth 
                    size="small"
                  />
                  
                  <TextField 
                    label="Medical History" 
                    placeholder="Comma separated" 
                    value={medicalHistory} 
                    onChange={(e) => setMedicalHistory(e.target.value)} 
                    multiline 
                    rows={2} 
                    fullWidth 
                    size="small"
                  />
                  
                  <TextField 
                    label="Allergies" 
                    placeholder="Comma separated" 
                    value={allergies} 
                    onChange={(e) => setAllergies(e.target.value)} 
                    fullWidth 
                    size="small"
                  />

                  <Button 
                    type="submit" 
                    disabled={creating}
                    variant="contained"
                    color="primary"
                    startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <UserPlus className="w-4 h-4" />}
                    sx={{ mt: 1, py: 1.5, borderRadius: 8, fontWeight: 600 }}
                  >
                    Register Patient
                  </Button>
                </Box>
              </form>
            </Card>
          </Box>

          {/* Patients List */}
          <Card sx={{ display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 1, bgcolor: 'background.paper', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Patient Directory</Typography>
              <TextField
                placeholder="Search patients..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><Search className="w-4 h-4" /></InputAdornment>,
                    sx: { borderRadius: 8, bgcolor: 'background.default' }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
              ) : filteredPatients.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 8, color: 'text.secondary' }}>
                  <Typography variant="body2">No patients found. Register a new patient.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table stickyHeader size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.02)' }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.02)' }}>Demographics</TableCell>
                        <TableCell sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.02)' }}>Clinical Details</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.02)' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPatients.map((p) => (
                        <TableRow key={p._id} hover>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', display: 'block' }}>ID: {p._id.slice(-6)}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>{p.contactNumber || 'No contact'}</Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top' }}>
                            <Typography variant="body2">{p.age} yrs, <span style={{ textTransform: 'capitalize' }}>{p.gender}</span>{p.weight ? `, ${p.weight} kg` : ''}</Typography>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: 'top', maxWidth: 300 }}>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 1 }}>History:</Typography>
                              <Typography variant="caption">{Array.isArray(p.medicalHistory) ? (p.medicalHistory.join(', ') || 'None') : (p.medicalHistory || 'None')}</Typography>
                            </Box>
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 1 }}>Allergies:</Typography>
                              {p.allergies?.length > 0 ? (
                                p.allergies.map((a: string, i: number) => (
                                  <Chip key={i} label={a} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', mr: 0.5, mb: 0.5 }} />
                                ))
                              ) : <Typography variant="caption">None</Typography>}
                            </Box>
                            {p.currentMedications?.length > 0 && (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 1 }}>Meds:</Typography>
                                {p.currentMedications.map((m: any, i: number) => (
                                  <Chip 
                                    key={i} 
                                    label={`${m.drugName} ${m.startDate ? `(${new Date(m.startDate).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})})` : ''}`} 
                                    size="small" 
                                    color="info" 
                                    variant="outlined" 
                                    sx={{ height: 20, fontSize: '0.65rem', mr: 0.5, mb: 0.5 }} 
                                  />
                                ))}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                            <IconButton 
                              onClick={() => handleDeletePatient(p)}
                              color="error"
                              size="small"
                              sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Card>
        </Box>
      </Box>

      <DeleteConfirmationModal
        isOpen={!!deletingPatient}
        title="Delete Patient Record"
        itemTitle={deletingPatient?.name || "Patient Record"}
        description="Are you sure you want to permanently delete this patient record? This action cannot be undone."
        onClose={() => setDeletingPatient(null)}
        onConfirm={confirmDeletePatient}
        loading={isDeleting}
      />
    </Box>
  );
}
