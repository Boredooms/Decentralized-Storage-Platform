import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from '@clerk/clerk-react';
import { motion } from "framer-motion";
import { 
  HardDrive, 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight, 
  Users, 
  Database,
  Lock,
  Network,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  
  const isAuthenticated = isSignedIn;
  const isLoading = !isLoaded;

  const features = [
    {
      icon: Shield,
      title: "Secure & Private",
      description: "End-to-end encryption with client-side keys ensures your data remains private and secure."
    },
    {
      icon: Network,
      title: "Decentralized",
      description: "No single point of failure. Your files are distributed across a global network of peers."
    },
    {
      icon: Zap,
      title: "Fast Retrieval",
      description: "Optimized chunk distribution and erasure coding for lightning-fast file access."
    },
    {
      icon: Globe,
      title: "Global Network",
      description: "Access your files from anywhere with our distributed peer-to-peer network."
    }
  ];

  const stats = [
    { label: "Active Peers", value: "2,847", icon: Users },
    { label: "Files Stored", value: "1.2M", icon: Database },
    { label: "Data Protected", value: "45TB", icon: HardDrive },
    { label: "Uptime", value: "99.9%", icon: CheckCircle }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight">DeStore</span>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button onClick={() => navigate("/dashboard")}>
                  Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
                Decentralized Storage
                <span className="block text-primary">Made Simple</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Store your files securely across a global network of peers. 
                No central servers, no single points of failure, complete privacy.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate(isAuthenticated ? "/dashboard?tab=contribute" : "/auth")}
                className="text-lg px-8 py-6"
              >
                {isAuthenticated ? "Contribute Storage" : "Start Contributing"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                className="text-lg px-8 py-6"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Storing Files"}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 sm:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="text-center space-y-2"
              >
                <stat.icon className="w-8 h-8 mx-auto text-primary mb-3" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight">
              Why Choose DeStore?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built on cutting-edge blockchain and peer-to-peer technology for 
              maximum security, reliability, and performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 sm:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl font-bold tracking-tight">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, secure, and transparent file storage in three easy steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload & Encrypt",
                description: "Your files are encrypted client-side and split into chunks with erasure coding for redundancy."
              },
              {
                step: "02", 
                title: "Distribute",
                description: "Chunks are distributed across multiple peers in the network with cryptographic proofs."
              },
              {
                step: "03",
                title: "Retrieve",
                description: "Download and decrypt your files from any device, anywhere in the world."
              }
            ].map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary-foreground">{step.step}</span>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-12 text-center space-y-6">
                <Lock className="w-16 h-16 mx-auto opacity-90" />
                <h2 className="text-3xl font-bold">
                  Ready to Secure Your Files?
                </h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  Join thousands of users who trust DeStore for their most important data. 
                  Start with 1GB free storage.
                </p>
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
                  className="text-lg px-8 py-6"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <HardDrive className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-semibold">DeStore</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © 2024 DeStore. Decentralized storage for everyone.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}