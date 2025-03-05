"use client";

import { useState, useEffect } from 'react';
import { useVerbRegistry } from '../../hooks/use-verb-registry';
import { Verb, VerbScope, VerbCategory } from '../../lib/types/verb';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Search, Filter, Tag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface VerbSelectorProps {
  scope?: VerbScope;
  pluginType?: string;
  credentialType?: string;
  onVerbSelect: (verb: Verb) => void;
  selectedVerbId?: string;
}

export function VerbSelector({
  scope,
  pluginType,
  credentialType,
  onVerbSelect,
  selectedVerbId
}: VerbSelectorProps) {
  const {
    verbs,
    categorizedVerbs,
    loading,
    error,
    fetchVerbs,
    fetchVerbsByScope
  } = useVerbRegistry();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>(VerbCategory.ACCESS);
  const [filteredVerbs, setFilteredVerbs] = useState<Verb[]>([]);
  
  // Filter verbs based on search term and active tab
  useEffect(() => {
    let filtered: Verb[] = [];
    
    if (activeTab === 'all') {
      filtered = verbs;
    } else {
      filtered = categorizedVerbs[activeTab as VerbCategory] || [];
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(verb => 
        verb.name.toLowerCase().includes(term) || 
        verb.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredVerbs(filtered);
  }, [verbs, categorizedVerbs, searchTerm, activeTab]);
  
  // Fetch verbs based on props
  useEffect(() => {
    if (scope) {
      fetchVerbsByScope(scope);
    } else {
      fetchVerbs({
        scope,
        pluginType,
        credentialType
      });
    }
  }, [fetchVerbs, fetchVerbsByScope, scope, pluginType, credentialType]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Handle verb selection
  const handleVerbSelect = (verb: Verb) => {
    onVerbSelect(verb);
  };
  
  // Render loading state
  if (loading && verbs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Verbs</CardTitle>
          <CardDescription>
            There was a problem loading the available verbs. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => fetchVerbs()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate tab counts
  const tabCounts = {
    all: verbs.length,
    [VerbCategory.ACCESS]: categorizedVerbs[VerbCategory.ACCESS].length,
    [VerbCategory.READ]: categorizedVerbs[VerbCategory.READ].length,
    [VerbCategory.WRITE]: categorizedVerbs[VerbCategory.WRITE].length,
    [VerbCategory.DELETE]: categorizedVerbs[VerbCategory.DELETE].length,
    [VerbCategory.ADMIN]: categorizedVerbs[VerbCategory.ADMIN].length,
    [VerbCategory.OTHER]: categorizedVerbs[VerbCategory.OTHER].length,
  };
  
  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search verbs..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <Select defaultValue={scope || 'all'}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value={VerbScope.GLOBAL}>Global</SelectItem>
            <SelectItem value={VerbScope.PLUGIN}>Plugin</SelectItem>
            <SelectItem value={VerbScope.CREDENTIAL}>Credential</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Category tabs */}
      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 md:grid-cols-7">
          <TabsTrigger value="all">
            All <Badge variant="outline" className="ml-1">{tabCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value={VerbCategory.ACCESS}>
            Access <Badge variant="outline" className="ml-1">{tabCounts[VerbCategory.ACCESS]}</Badge>
          </TabsTrigger>
          <TabsTrigger value={VerbCategory.READ}>
            Read <Badge variant="outline" className="ml-1">{tabCounts[VerbCategory.READ]}</Badge>
          </TabsTrigger>
          <TabsTrigger value={VerbCategory.WRITE}>
            Write <Badge variant="outline" className="ml-1">{tabCounts[VerbCategory.WRITE]}</Badge>
          </TabsTrigger>
          <TabsTrigger value={VerbCategory.DELETE}>
            Delete <Badge variant="outline" className="ml-1">{tabCounts[VerbCategory.DELETE]}</Badge>
          </TabsTrigger>
          <TabsTrigger value={VerbCategory.ADMIN}>
            Admin <Badge variant="outline" className="ml-1">{tabCounts[VerbCategory.ADMIN]}</Badge>
          </TabsTrigger>
          <TabsTrigger value={VerbCategory.OTHER}>
            Other <Badge variant="outline" className="ml-1">{tabCounts[VerbCategory.OTHER]}</Badge>
          </TabsTrigger>
        </TabsList>
        
        {/* Tab content */}
        {Object.values(VerbCategory).concat('all' as any).map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            {filteredVerbs.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Verbs Found</CardTitle>
                  <CardDescription>
                    No verbs match your current filters. Try adjusting your search or filters.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVerbs.map((verb) => (
                  <Card 
                    key={verb.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedVerbId === verb.id ? 'border-2 border-primary' : ''
                    }`}
                    onClick={() => handleVerbSelect(verb)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{verb.name}</CardTitle>
                        <Badge>{verb.scope}</Badge>
                      </div>
                      <CardDescription>{verb.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {verb.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                        {verb.pluginType && (
                          <Badge variant="secondary">Plugin: {verb.pluginType}</Badge>
                        )}
                        {verb.credentialType && (
                          <Badge variant="secondary">Credential: {verb.credentialType}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 