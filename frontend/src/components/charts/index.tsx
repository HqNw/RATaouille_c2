"use client"

import React from 'react'

// This is a mock implementation of chart components
// In a real application, you would use a library like recharts, visx, or tremor

export function LineChart({ 
  data, 
  categories, 
  index, 
  colors = ['#7c3aed', '#10b981', '#6366f1'],
  valueFormatter = (value: number) => `${value}`,
  showLegend = true
}) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 relative">
            {/* Mock chart lines */}
            <div className="absolute inset-0">
              {categories.map((category, i) => (
                <div 
                  key={category}
                  className="absolute bottom-0 left-0 right-0 h-1/2"
                  style={{ 
                    borderBottom: `2px solid ${colors[i % colors.length]}`,
                    borderRadius: '50%',
                    height: `${40 + i * 15}%`,
                    opacity: 0.7
                  }}
                ></div>
              ))}
              
              {/* Data points */}
              {categories.map((category, i) => (
                <React.Fragment key={`points-${category}`}>
                  {data.map((item, j) => (
                    <div 
                      key={`point-${category}-${j}`}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: colors[i % colors.length],
                        bottom: `${(item[category] / 100) * 70}%`,
                        left: `${(j / (data.length - 1)) * 100}%`,
                      }}
                    ></div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* X-axis labels */}
          <div className="h-6 flex justify-between text-xs text-muted-foreground">
            {data.filter((_, i) => i % 4 === 0 || i === data.length - 1).map((item, i) => (
              <div key={`label-${i}`} className="px-1">
                {item[index]}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute top-0 left-0 bottom-6 w-10 flex flex-col justify-between text-xs text-muted-foreground">
        <div>100%</div>
        <div>75%</div>
        <div>50%</div>
        <div>25%</div>
        <div>0%</div>
      </div>
    </div>
  )
}

export function AreaChart({ 
  data, 
  categories, 
  index, 
  colors = ['#7c3aed', '#10b981', '#6366f1'],
  valueFormatter = (value: number) => `${value}`,
  showLegend = true
}) {
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 relative">
            {/* Background grid */}
            <div className="absolute inset-0 grid grid-rows-4 gap-0">
              {[0, 1, 2, 3].map((i) => (
                <div key={`grid-${i}`} className="border-t border-muted"></div>
              ))}
            </div>
            
            {/* Mock chart areas */}
            <div className="absolute inset-0">
              {categories.map((category, i) => (
                <div 
                  key={category}
                  className="absolute bottom-0 left-0 right-0"
                  style={{ 
                    background: `linear-gradient(to bottom, ${colors[i % colors.length]}20, transparent)`,
                    height: `${50 + (i * 10)}%`,
                    opacity: 0.7
                  }}
                ></div>
              ))}
              
              {/* Chart lines */}
              {categories.map((category, i) => (
                <div 
                  key={`line-${category}`}
                  className="absolute bottom-0 left-0 right-0"
                  style={{ 
                    borderTop: `2px solid ${colors[i % colors.length]}`,
                    height: `${50 + (i * 10)}%`,
                  }}
                ></div>
              ))}
              
              {/* Data points */}
              {categories.map((category, i) => (
                <React.Fragment key={`points-${category}`}>
                  {data.map((item, j) => (
                    <div 
                      key={`point-${category}-${j}`}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ 
                        backgroundColor: colors[i % colors.length],
                        bottom: `${(item[category] / 100) * 70}%`,
                        left: `${(j / (data.length - 1)) * 100}%`,
                      }}
                    ></div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* X-axis labels */}
          <div className="h-6 flex justify-between text-xs text-muted-foreground">
            {data.filter((_, i) => i % 4 === 0 || i === data.length - 1).map((item, i) => (
              <div key={`label-${i}`} className="px-1">
                {item[index]}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute top-0 left-0 bottom-6 w-10 flex flex-col justify-between text-xs text-muted-foreground">
        <div>100%</div>
        <div>75%</div>
        <div>50%</div>
        <div>25%</div>
        <div>0%</div>
      </div>
    </div>
  )
}

export function DonutChart({ 
  data, 
  category, 
  index, 
  colors = ['#7c3aed', '#10b981', '#6366f1'],
  valueFormatter = (value: number) => `${value}`,
  showLegend = true
}) {
  const total = data.reduce((sum, item) => sum + item[category], 0)
  
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <div className="relative w-32 h-32">
        {/* Create donut segments */}
        {data.map((item, i) => {
          const percentage = (item[category] / total) * 100
          const previousPercentages = data
            .slice(0, i)
            .reduce((sum, prevItem) => sum + (prevItem[category] / total) * 100, 0)
          
          return (
            <div 
              key={item[index]}
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{ 
                clipPath: `polygon(50% 50%, 50% 0%, ${percentage < 25 ? '50% 0%' : '100% 0%'}, ${percentage < 50 ? '100% 0%' : '100% 100%'}, ${percentage < 75 ? '100% 100%' : '0% 100%'}, ${percentage < 100 ? '0% 100%' : '0% 0%'}, ${percentage === 100 ? '50% 0%' : '50% 50%'})`,
                transform: `rotate(${previousPercentages * 3.6}deg)`,
                backgroundColor: colors[i % colors.length],
              }}
            ></div>
          )
        })}
        
        {/* Inner circle for donut hole */}
        <div className="absolute inset-0 m-auto w-20 h-20 bg-card rounded-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-4 text-xs">
          {data.map((item, i) => (
            <div key={`legend-${item[index]}`} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: colors[i % colors.length] }}
              ></div>
              <span>{item[index]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}