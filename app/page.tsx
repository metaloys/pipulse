'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { StatsCard } from '@/components/stats-card';
import { TaskCard } from '@/components/task-card';
import { Leaderboard } from '@/components/leaderboard';
import { TaskSubmissionModal } from '@/components/task-submission-modal';
import { EmployerDashboard } from '@/components/employer-dashboard';
import { CreateTaskModal } from '@/components/create-task-modal';
import { Button } from '@/components/ui/button';
import { usePiAuth } from '@/contexts/pi-auth-context';
import { getAllTasks, getLeaderboard, submitTask, getTasksByEmployer, getUserStats, updateUser, getUserById } from '@/lib/database';
import { mockUserStats } from '@/lib/mock-data';
import type { UserRole, TaskCategory, DatabaseTask, LeaderboardEntry } from '@/lib/types';
import { 
  Coins, 
  CheckCircle, 
  Target, 
  TrendingUp,
  Briefcase,
  Plus,
} from 'lucide-react';

export default function HomePage() {
  const { userData } = usePiAuth();
  
  const [userRole, setUserRole] = useState<UserRole>('worker');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [employerTasks, setEmployerTasks] = useState<DatabaseTask[]>([]);
  const [userStats, setUserStats] = useState(mockUserStats);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<DatabaseTask | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);

  // Load user's current role from database
  useEffect(() => {
    const loadUserRole = async () => {
      if (userData?.id) {
        try {
          const user = await getUserById(userData.id);
          if (user) {
            console.log('📋 User role from database:', user.user_role);
            setUserRole(user.user_role);
          }
        } catch (error) {
          console.error('Error loading user role:', error);
        }
      }
    };
    loadUserRole();
  }, [userData?.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real tasks from Supabase
        const tasksData = await getAllTasks();
        setTasks(tasksData);
        
        // Fetch real leaderboard from Supabase
        const leaderboardData = await getLeaderboard(10);
        const formattedLeaderboard = leaderboardData.map((entry, index) => ({
          rank: index + 1,
          username: entry.pi_username,
          earnings: entry.total_earnings,
          tasksCompleted: entry.total_tasks_completed,
        }));
        setLeaderboardEntries(formattedLeaderboard);

        // Fetch real user stats if logged in
        if (userData?.id) {
          const realStats = await getUserStats(userData.id);
          if (realStats) {
            setUserStats(realStats);
          }
        }

        // If user is an employer, load their tasks
        if (userData?.id && userRole === 'employer') {
          const userEmployerTasks = await getTasksByEmployer(userData.id);
          setEmployerTasks(userEmployerTasks);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userData?.id, userRole]);

  const handleRoleSwitch = async () => {
    if (!userData?.id || isRoleSwitching) return;

    setIsRoleSwitching(true);
    const newRole = userRole === 'worker' ? 'employer' : 'worker';

    try {
      console.log(`🔄 Switching user role from ${userRole} to ${newRole}...`);

      const result = await updateUser(userData.id, {
        user_role: newRole,
      });

      if (result) {
        console.log(`✅ User role updated to ${newRole}:`, result.user_role);
        setUserRole(newRole);

        // Clear employer tasks if switching to worker
        if (newRole === 'worker') {
          setEmployerTasks([]);
        }
      } else {
        console.error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error switching role:', error);
    } finally {
      setIsRoleSwitching(false);
    }
  };

  const handleAcceptTask = (task: DatabaseTask) => {
    setSelectedTask(task);
    setIsSubmissionModalOpen(true);
  };

  const handleSubmitTask = async (taskId: string, proof: string, submissionType: 'text' | 'photo' | 'audio' | 'file') => {
    try {
      // Get the worker ID from Pi Auth context
      if (!userData?.id) {
        throw new Error('User not authenticated. Please login with Pi Network.');
      }

      const workerId = userData.id;
      
      await submitTask({
        task_id: taskId,
        worker_id: workerId,
        proof_content: proof,
        submission_type: submissionType,
        submission_status: 'pending',
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      
      // Refresh tasks after submission
      const tasksData = await getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  const categories: { value: TaskCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Tasks' },
    { value: 'app-testing', label: 'App Testing' },
    { value: 'survey', label: 'Surveys' },
    { value: 'translation', label: 'Translation' },
    { value: 'audio-recording', label: 'Audio' },
    { value: 'photo-capture', label: 'Photos' },
    { value: 'content-review', label: 'Review' },
    { value: 'data-labeling', label: 'Data Labeling' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        userRole={userRole} 
        onRoleSwitch={handleRoleSwitch}
        currentStreak={userStats.currentStreak}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        {userRole === 'worker' ? (
          <>
            {/* Stats Overview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Welcome back, Pioneer
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Level: {userStats.level}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard
                  label="Today's Earnings"
                  value={`${userStats.dailyEarnings} π`}
                  icon={<Coins className="w-8 h-8" />}
                  trend="+2.5 π from yesterday"
                />
                <StatsCard
                  label="Tasks Completed"
                  value={userStats.tasksCompleted}
                  icon={<CheckCircle className="w-8 h-8" />}
                />
                <StatsCard
                  label="Available Tasks"
                  value={tasks.length}
                  icon={<Target className="w-8 h-8" />}
                />
                <StatsCard
                  label="Weekly Earnings"
                  value={`${userStats.weeklyEarnings} π`}
                  icon={<TrendingUp className="w-8 h-8" />}
                  trend="+18% from last week"
                />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground mb-3">Available Tasks</h2>
                  
                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((category) => (
                      <Button
                        key={category.value}
                        variant={selectedCategory === category.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.value)}
                        className={`rounded-full whitespace-nowrap ${
                          selectedCategory === category.value
                            ? 'bg-primary hover:bg-primary/90'
                            : 'border-white/10 hover:border-primary/50'
                        }`}
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onAccept={handleAcceptTask} />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <Leaderboard entries={leaderboardEntries} />
                
                {/* Quick Stats */}
                <div className="glassmorphism p-5 border-white/10 rounded-lg">
                  <h3 className="text-lg font-bold text-foreground mb-4">Your Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Total Earnings</span>
                        <span className="font-bold text-primary">{userStats.totalEarnings} π</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        132 π to Elite Pioneer
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Current Streak</span>
                        <span className="text-2xl font-bold text-orange-400">
                          {userStats.currentStreak} 🔥
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Complete a task today to keep your streak!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Employer View */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Employer Dashboard
              </h1>
              <p className="text-muted-foreground">
                Review worker submissions and manage your tasks
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <StatsCard
                label="Active Tasks"
                value={employerTasks.length}
                icon={<Target className="w-8 h-8" />}
              />
              <StatsCard
                label="Total Reward"
                value={`${employerTasks.reduce((sum, t) => sum + t.pi_reward, 0)} π`}
                icon={<Coins className="w-8 h-8" />}
              />
              <StatsCard
                label="Slots Available"
                value={employerTasks.reduce((sum, t) => sum + t.slots_remaining, 0)}
                icon={<CheckCircle className="w-8 h-8" />}
              />
            </div>

            {userData?.id && employerTasks.length > 0 ? (
              <EmployerDashboard employerId={userData.id} employerTasks={employerTasks} />
            ) : (
              <div className="glassmorphism p-8 border-white/10 rounded-lg text-center">
                <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Post Your First Task
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Get work done by verified Pioneers. Pay only for completed tasks with Pi coins.
                </p>
                {userData?.id && userData.username && (
                  <CreateTaskModal
                    employerId={userData.id}
                    employerUsername={userData.username}
                    onTaskCreated={() => {
                      // Reload employer tasks
                      const loadTasks = async () => {
                        const userEmployerTasks = await getTasksByEmployer(userData.id);
                        setEmployerTasks(userEmployerTasks);
                      };
                      loadTasks();
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Task Submission Modal */}
      <TaskSubmissionModal
        isOpen={isSubmissionModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsSubmissionModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleSubmitTask}
      />
    </div>
  );
}
