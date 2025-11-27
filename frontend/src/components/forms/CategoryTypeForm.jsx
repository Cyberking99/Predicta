import React from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
// Import category icons utility
import { CategoryIcon, getCategoryIcon } from "../../utils/categoryIcons";

const CategoryTypeForm = ({ 
  formData, 
  setFormData, 
  categoryList, 
  isUsingFallbackData, 
  refetchCategories, 
  toggleInfoTooltip, 
  showInfoTooltip, 
  showCategoryDropdown, 
  setShowCategoryDropdown,
  getCategoryName,
  handleCategorySelect
}) => {
  // Get the selected category object for icon preview
  const selectedCategory = categoryList.find(cat => cat.id === formData.categoryId);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Event Category & Type</h2>
      
      {/* Category */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <label className="text-white font-medium">Category</label>
            <div className="relative ml-2">
              <HelpCircle 
                className="w-4 h-4 text-cyan-400 cursor-pointer" 
                onClick={() => toggleInfoTooltip('category')}
              />
              {showInfoTooltip.category && (
                <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                  Select the category that best fits your prediction event. Each category will display with its unique icon.
                </div>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={refetchCategories}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            Refresh Categories
          </button>
        </div>
        <div className="relative">
          <div 
            className="w-full bg-[#1A1F3F] text-white border border-[#2A3052] rounded-lg p-3 flex items-center justify-between cursor-pointer"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <div className="flex items-center gap-3">
              {/* Category icon preview */}
              <div className="w-6 h-6 rounded-sm bg-[#01052D] flex items-center justify-center text-cyan-400">
                <CategoryIcon 
                  categoryName={selectedCategory?.name}
                  categoryLabel={selectedCategory?.label}
                  className="w-4 h-4"
                />
              </div>
              <span>{getCategoryName(formData.categoryId)}</span>
            </div>
            {showCategoryDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          {showCategoryDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-[#1A1F3F] border border-[#2A3052] rounded-lg max-h-56 overflow-y-auto">
              {categoryList.map((category) => (
                <div 
                  key={category.id}
                  className={`p-3 text-white hover:bg-[#252B4F] cursor-pointer border-b border-[#2A3052] last:border-0 flex items-center gap-3 ${
                    !category.active ? 'opacity-50' : ''
                  }`}
                  onClick={() => category.active && handleCategorySelect(category.id)}
                >
                  {/* Category icon in dropdown */}
                  <div className="w-5 h-5 rounded-sm bg-[#01052D] flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <CategoryIcon 
                      categoryName={category.name}
                      categoryLabel={category.label}
                      className="w-3 h-3"
                    />
                  </div>
                  <div className="flex-1">
                    {category.name}
                    {!category.active && <span className="text-xs text-red-400 ml-2">(Inactive)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Category preview section */}
        {selectedCategory && (
          <div className="mt-3 p-3 bg-[#252B4F] rounded-lg border border-[#2A3052]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-[#01052D] flex items-center justify-center text-cyan-400">
                <CategoryIcon 
                  categoryName={selectedCategory.name}
                  categoryLabel={selectedCategory.label}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Preview</p>
                <p className="text-gray-400 text-xs">This icon will appear on your event card</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Event Type - Private option commented out */}
      <div>
        <div className="flex items-center mb-2">
          <label className="text-white font-medium">Event Type</label>
          <div className="relative ml-2">
            <HelpCircle 
              className="w-4 h-4 text-cyan-400 cursor-pointer" 
              onClick={() => toggleInfoTooltip('eventType')}
            />
            {showInfoTooltip.eventType && (
              <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                Public events are visible to all users.
                {/* Private events are invitation-only. */}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            className={`flex-1 py-3 rounded-lg font-medium ${
              formData.eventType === 'public'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#09113B]'
                : 'bg-[#1A1F3F] text-white border border-[#2A3052]'
            }`}
            onClick={() => setFormData({ ...formData, eventType: 'public' })}
          >
            Public
          </button>
          {/* Private option commented out - not in use currently */}
          {/* <button
            type="button"
            className={`flex-1 py-3 rounded-lg font-medium ${
              formData.eventType === 'private'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#09113B]'
                : 'bg-[#1A1F3F] text-white border border-[#2A3052]'
            }`}
            onClick={() => setFormData({ ...formData, eventType: 'private' })}
          >
            Private
          </button> */}
        </div>
      </div>
      
      {/* Event Image URL (Optional) */}
      {/* <div>
        <div className="flex items-center mb-2">
          <label className="text-white font-medium">Event Image URL (Optional)</label>
          <div className="relative ml-2">
            <HelpCircle 
              className="w-4 h-4 text-cyan-400 cursor-pointer" 
              onClick={() => toggleInfoTooltip('image')}
            />
            {showInfoTooltip.image && (
              <div className="absolute z-10 w-64 bg-[#1A1F3F] border border-cyan-700 p-3 rounded-lg text-sm text-white -right-2 top-6">
                Provide a URL to an image representing your event. Leave blank if none.
              </div>
            )}
          </div>
        </div>
        <input
          type="text"
          name="eventImage"
          value={formData.eventImage}
          onChange={(e) => setFormData({...formData, eventImage: e.target.value})}
          placeholder="https://example.com/image.jpg"
          className="w-full bg-[#1A1F3F] text-white border border-[#2A3052] rounded-lg p-3 placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
        />
      </div> */}
    </div>
  );
};

export default CategoryTypeForm;