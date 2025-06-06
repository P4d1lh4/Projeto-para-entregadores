import React, { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { nominatimService } from '@/services/nominatimService';

interface AddressSearchProps {
  onLocationSelect?: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({
  onLocationSelect,
  placeholder = "Search address...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  const searchAddresses = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await nominatimService.searchPlaces(searchQuery, 5);
      setResults(searchResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddresses(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchAddresses]);

  const handleLocationSelect = (result: SearchResult) => {
    setQuery(result.displayName);
    setShowResults(false);
    
    if (onLocationSelect) {
      onLocationSelect({
        latitude: result.latitude,
        longitude: result.longitude,
        address: result.displayName
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
        )}
        {query && !isSearching && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full px-3 py-2 text-left hover:bg-muted/50 border-b last:border-b-0 flex items-start gap-2"
                >
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.displayName.split(',')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.displayName}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {result.type === 'address' ? 'Address' : 'Location'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/20">
              🗺️ Powered by OpenStreetMap & Nominatim
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !isSearching && query.trim().length >= 3 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-3 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Nenhum resultado encontrado</div>
            <div className="text-xs">Tente uma pesquisa mais específica</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressSearch; 