'use client';

import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { Typography, Container, Paper, Box, Grid, TextField, Button } from '@mui/material';
import { useState } from 'react';

function ProfileContent() {
    const { user } = useAuth();
    const [editing, setEditing] = useState(false);

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Mon Profil
                </Typography>

                <Box sx={{ mt: 4 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" gutterBottom>
                                Informations personnelles
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Nom"
                                value={user?.full_name || ''}
                                disabled={!editing}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={user?.email || ''}
                                disabled
                                variant="outlined"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Rôle"
                                value={user?.role || ''}
                                disabled
                                variant="outlined"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="ID"
                                value={user?.id || ''}
                                disabled
                                variant="outlined"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {!editing ? (
                                    <Button
                                        variant="contained"
                                        onClick={() => setEditing(true)}
                                    >
                                        Modifier
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            variant="contained"
                                            onClick={() => {
                                                // Save changes logic here
                                                setEditing(false);
                                            }}
                                        >
                                            Enregistrer
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setEditing(false)}
                                        >
                                            Annuler
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Container>
    );
}

export default function UserProfile() {
    return (
        <RequireRole allowedRoles={['client', 'admin', 'superadmin']}>
            <ProfileContent />
        </RequireRole>
    );
}
