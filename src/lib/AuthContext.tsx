import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserContext, AppRole } from '../types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    userContext: UserContext | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ data: any; error: Error | null }>;
    signInDemo: () => Promise<{ error: null }>;
    setSession: (session: Session) => void;
    signOut: () => Promise<void>;
    refreshUserContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userContext, setUserContext] = useState<UserContext | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserContext = async (user: User): Promise<UserContext | null> => {
        try {
            const userId = user.id;
            let rawRole = (user.user_metadata?.role || user.app_metadata?.role) as string;
            let role: AppRole | undefined;

            // Normalize Role
            if (rawRole === 'department') role = 'DEPARTMENT_ADMIN';
            else if (rawRole === 'establishment') role = 'ESTABLISHMENT_ADMIN';
            else if (rawRole === 'worker') role = 'WORKER';
            else if (rawRole === 'DEPARTMENT_ADMIN' || rawRole === 'ESTABLISHMENT_ADMIN' || rawRole === 'WORKER') {
                role = rawRole as AppRole;
            }

            if (!role) {
                console.warn('No role found for user');
                return null;
            }

            let profileData: any = {};

            // Fetch Profile based on Role
            if (role === 'WORKER') {
                const meta = user.user_metadata || {};
                profileData = {
                    worker_id: meta.worker_id,
                    full_name: meta.full_name || 'Worker',
                };

                if (meta.worker_uuid) {
                    profileData.worker_id = meta.worker_uuid;
                } else if (meta.worker_id) {
                    try {
                        const { data: wData } = await supabase
                            .from('workers')
                            .select('id, first_name, last_name')
                            .eq('worker_id', meta.worker_id)
                            .maybeSingle();

                        if (wData) {
                            profileData.full_name = `${wData.first_name || ''} ${wData.last_name || ''}`.trim();
                            profileData.worker_id = wData.id;
                        }
                    } catch (e) {
                        console.warn('Could not fetch worker profile', e);
                    }
                }
            }

            const context: UserContext = {
                authUserId: userId,
                role: role,
                workerId: profileData?.worker_id || undefined,
                fullName: profileData?.full_name || undefined,
                email: user.email || undefined,
            };

            return context;
        } catch (error) {
            console.error('Error in fetchUserContext:', error);
            return null;
        }
    };

    const refreshUserContext = async () => {
        if (user) {
            const context = await fetchUserContext(user);
            setUserContext(context);
        }
    };

    useEffect(() => {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const context = await fetchUserContext(session.user);
                    setUserContext(context);
                } else {
                    setUserContext(null);
                }
                setLoading(false);
            }
        );

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchUserContext(session.user).then((context) => {
                    setUserContext(context);
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        }).catch((err) => {
            console.warn('Session check failed', err);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signInDemo = async () => {
        const demoUser: User = {
            id: 'demo-worker-123',
            app_metadata: { provider: 'email' },
            user_metadata: { role: 'worker', full_name: 'Hareesh Kumar', worker_id: 'WKR12345' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
        } as any;

        const demoSession: Session = {
            access_token: 'demo-token',
            refresh_token: 'demo-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: demoUser,
        };

        setSession(demoSession);
        setUser(demoUser);

        const context: UserContext = {
            authUserId: demoUser.id,
            role: 'WORKER',
            workerId: 'WKR12345',
            fullName: 'Hareesh Kumar',
            email: 'demo@example.com',
        };
        setUserContext(context);
        return { error: null };
    };

    const setSessionManual = async (newSession: Session) => {
        const { error } = await supabase.auth.setSession(newSession);
        if (error) {
            console.error('Failed to set Supabase session', error);
            throw error;
        }
        setSession(newSession);
        setUser(newSession.user);
        if (newSession.user) {
            const context = await fetchUserContext(newSession.user);
            setUserContext(context);
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('Supabase signOut error (ignored):', e);
        }
        setUser(null);
        setSession(null);
        setUserContext(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                userContext,
                loading,
                signIn,
                signInDemo,
                setSession: setSessionManual,
                signOut,
                refreshUserContext,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
